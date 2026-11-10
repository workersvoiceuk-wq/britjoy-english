-- «Inglés para el día a día» · reembolsos completos y disputas (contracargos).
-- Antes: paid_until salía solo de invoice.paid, así que un reembolso completo de la factura pagada dejaba el acceso
-- abierto hasta el final del periodo si no llegaba otro evento de suscripción.
-- Ahora cada factura pagada queda registrada con su cuenta, suscripción y periodo (course_invoices); invoice_payment.paid
-- enlaza la factura con su PaymentIntent o cargo (course_payment_links); charge.refunded y charge.dispute.* marcan ese
-- cargo (course_payment_reversals). paid_until = fin más tardío entre las facturas de la suscripción sin reversión
-- activa. Solo cae el periodo de esa factura; otras cuentas, suscripciones y periodos pagados no cambian.
-- Mismo modelo que paidUntilFor()/applyReversal() en supabase/functions/_shared/vida-diaria.ts.
--
-- Aditiva: añade una columna con valor por defecto y tablas nuevas. Sustituye las funciones del curso
-- apply_course_access y apply_course_payment (esta última gana el parámetro p_invoice). No toca profiles,
-- plus_until, créditos ni VUM Academy.

alter table public.course_access add column payment_reversed boolean not null default false;

create table public.course_invoices (
  stripe_invoice_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  product text not null check (product = 'vida_diaria_monthly'),
  stripe_subscription_id text not null,
  paid_until timestamptz not null,
  created_at timestamptz not null default now()
);
create index course_invoices_subscription on public.course_invoices (user_id, product, stripe_subscription_id);

-- PaymentIntent o cargo → factura. invoice_payment.paid no lleva cuenta ni producto: también se guardan los de otros
-- productos de la cuenta de Stripe (solo IDs), que no cambian nada porque no enlazan con ninguna fila de course_invoices.
create table public.course_payment_links (
  payment_ref text primary key,
  stripe_invoice_id text not null,
  created_at timestamptz not null default now()
);
create index course_payment_links_invoice on public.course_payment_links (stripe_invoice_id);

-- Último estado de cada reembolso (refund:<cargo>), disputa (dispute:<id>) o alerta de fraude (efw:<id>).
create table public.course_payment_reversals (
  source_id text primary key,
  kind text not null check (kind in ('refund', 'dispute', 'fraud_warning')),
  refs text[] not null,
  active boolean not null,
  -- Estado final de la disputa (won, lost, warning_closed, prevented): en el mismo segundo gana a una apertura.
  terminal boolean not null default false,
  last_event_created bigint not null,
  updated_at timestamptz not null default now()
);
create index course_payment_reversals_refs on public.course_payment_reversals using gin (refs);

alter table public.course_invoices enable row level security;
alter table public.course_payment_links enable row level security;
alter table public.course_payment_reversals enable row level security; -- sin políticas: solo service role
grant select, insert, update on public.course_invoices, public.course_payment_links, public.course_payment_reversals to service_role;

-- Facturas ya registradas por la migración anterior (si se aplicó en un entorno de pruebas): conservan su periodo.
insert into public.course_invoices (stripe_invoice_id, user_id, product, stripe_subscription_id, paid_until)
  select 'legacy:' || e.stripe_event_id, e.user_id, e.product, e.stripe_subscription_id, e.paid_until
  from public.course_access_events e
  where e.paid_until is not null and e.user_id is not null and e.stripe_subscription_id is not null
  on conflict (stripe_invoice_id) do nothing;

-- Estado pagado de (cuenta, suscripción): fin más tardío sin reversión y si la factura más reciente está revertida.
create function public.course_paid_state(p_user uuid, p_product text, p_subscription text, out paid_until timestamptz, out reversed boolean)
language sql stable security definer set search_path = '' as $$
  with inv as (
    select i.paid_until, exists (
      select 1 from public.course_payment_reversals r
      join public.course_payment_links l on l.payment_ref = any (r.refs)
      where r.active and l.stripe_invoice_id = i.stripe_invoice_id
    ) as rev
    from public.course_invoices i
    where i.user_id = p_user and i.product = p_product and i.stripe_subscription_id = p_subscription
  )
  select (select max(inv.paid_until) from inv where not inv.rev),
         coalesce((select inv.rev from inv order by inv.paid_until desc limit 1), false);
$$;

create function public.refresh_course_paid(p_user uuid, p_product text, p_subscription text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  s record;
begin
  select * into s from public.course_paid_state(p_user, p_product, p_subscription);
  update public.course_access as a set paid_until = s.paid_until, payment_reversed = s.reversed, updated_at = now()
    where a.user_id = p_user and a.product = p_product and a.stripe_subscription_id = p_subscription;
end;
$$;

-- Todas las escrituras del libro de pagos del curso se serializan (producto de bajo volumen): así un pago y su
-- reembolso que llegan a la vez no pueden perderse el uno al otro.
create function public.lock_course_payment_book() returns void
language sql security definer set search_path = '' as $$ select pg_advisory_xact_lock(hashtext('vida_diaria_payment_book')); $$;

create or replace function public.apply_course_access(
  p_event text, p_event_created bigint, p_user uuid, p_product text, p_status text,
  p_access_until timestamptz, p_cancel boolean, p_subscription text, p_customer text
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_prev bigint;
  s record;
begin
  perform public.lock_course_payment_book();
  if not exists (select 1 from auth.users where id = p_user) then
    insert into public.course_access_events (stripe_event_id, user_id, product)
      values (p_event, null, p_product) on conflict (stripe_event_id) do nothing;
    return false;
  end if;
  insert into public.course_access (user_id, product, status) values (p_user, p_product, 'incomplete')
    on conflict (user_id, product) do nothing;
  select last_event_created into v_prev from public.course_access
    where user_id = p_user and product = p_product for update;
  insert into public.course_access_events (stripe_event_id, user_id, product)
    values (p_event, p_user, p_product) on conflict (stripe_event_id) do nothing;
  if not found then
    return false; -- ya aplicado
  end if;
  if v_prev is not null and v_prev > p_event_created then
    return false; -- evento antiguo que llega tarde
  end if;
  select * into s from public.course_paid_state(p_user, p_product, p_subscription);
  update public.course_access as a set
    status = p_status,
    access_until = p_access_until,
    cancel_at_period_end = coalesce(p_cancel, false),
    stripe_subscription_id = p_subscription,
    stripe_customer_id = coalesce(p_customer, a.stripe_customer_id),
    paid_until = s.paid_until,
    payment_reversed = s.reversed,
    last_event_created = p_event_created,
    updated_at = now()
  where a.user_id = p_user and a.product = p_product;
  return true;
end;
$$;

drop function public.apply_course_payment(text, uuid, text, timestamptz, text);

-- invoice.paid: una vez por evento y una vez por factura (una factura reenviada con otro evento no cambia nada).
create function public.apply_course_payment(p_event text, p_user uuid, p_product text, p_paid_until timestamptz, p_subscription text, p_invoice text)
returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if p_subscription is null or p_invoice is null then
    return false;
  end if;
  perform public.lock_course_payment_book();
  if not exists (select 1 from auth.users where id = p_user) then
    insert into public.course_access_events (stripe_event_id, user_id, product) values (p_event, null, p_product)
      on conflict (stripe_event_id) do nothing;
    return false;
  end if;
  insert into public.course_access (user_id, product, status, stripe_subscription_id)
    values (p_user, p_product, 'incomplete', p_subscription)
    on conflict (user_id, product) do nothing;
  perform 1 from public.course_access where user_id = p_user and product = p_product for update;
  insert into public.course_access_events (stripe_event_id, user_id, product, stripe_subscription_id, paid_until)
    values (p_event, p_user, p_product, p_subscription, p_paid_until)
    on conflict (stripe_event_id) do nothing;
  if not found then
    return false;
  end if;
  insert into public.course_invoices (stripe_invoice_id, user_id, product, stripe_subscription_id, paid_until)
    values (p_invoice, p_user, p_product, p_subscription, p_paid_until)
    on conflict (stripe_invoice_id) do nothing;
  perform public.refresh_course_paid(p_user, p_product, p_subscription);
  return true;
end;
$$;

-- invoice_payment.paid: enlaza el PaymentIntent o cargo con su factura.
create function public.apply_course_payment_link(p_event text, p_invoice text, p_refs text[])
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  i record;
begin
  perform public.lock_course_payment_book();
  insert into public.course_access_events (stripe_event_id, user_id, product)
    values (p_event, null, 'vida_diaria_monthly') on conflict (stripe_event_id) do nothing;
  if not found then
    return false;
  end if;
  insert into public.course_payment_links (payment_ref, stripe_invoice_id)
    select r, p_invoice from unnest(p_refs) as r where r is not null
    on conflict (payment_ref) do nothing;
  for i in select * from public.course_invoices where stripe_invoice_id = p_invoice loop
    perform 1 from public.course_access where user_id = i.user_id and product = i.product for update;
    perform public.refresh_course_paid(i.user_id, i.product, i.stripe_subscription_id);
  end loop;
  return true;
end;
$$;

-- charge.refunded / charge.dispute.* / radar.early_fraud_warning.*: último estado de ese reembolso o disputa.
-- event.created tiene resolución de 1 s: con el mismo segundo, un estado terminal es más nuevo que uno no terminal.
-- El ID del evento no se usa como reloj. Mismo criterio que reversalIsOlder() en _shared/vida-diaria.ts.
create function public.apply_course_reversal(p_event text, p_event_created bigint, p_source text, p_kind text, p_refs text[], p_active boolean, p_terminal boolean)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_prev bigint;
  v_prev_terminal boolean;
  i record;
begin
  perform public.lock_course_payment_book();
  insert into public.course_access_events (stripe_event_id, user_id, product)
    values (p_event, null, 'vida_diaria_monthly') on conflict (stripe_event_id) do nothing;
  if not found then
    return false;
  end if;
  select last_event_created, terminal into v_prev, v_prev_terminal from public.course_payment_reversals where source_id = p_source;
  if v_prev is not null and (v_prev > p_event_created or (v_prev = p_event_created and v_prev_terminal and not coalesce(p_terminal, false))) then
    return false; -- estado antiguo de la misma disputa o reembolso (o no terminal tras el cierre en el mismo segundo)
  end if;
  insert into public.course_payment_reversals (source_id, kind, refs, active, terminal, last_event_created)
    values (p_source, p_kind, p_refs, p_active, coalesce(p_terminal, false), p_event_created)
    on conflict (source_id) do update set
      refs = (select array_agg(distinct x) from unnest(public.course_payment_reversals.refs || excluded.refs) as x),
      active = excluded.active, terminal = excluded.terminal, last_event_created = excluded.last_event_created, updated_at = now();
  for i in
    select distinct inv.* from public.course_invoices inv
    join public.course_payment_links l on l.stripe_invoice_id = inv.stripe_invoice_id
    where l.payment_ref = any (p_refs)
  loop
    perform 1 from public.course_access where user_id = i.user_id and product = i.product for update;
    perform public.refresh_course_paid(i.user_id, i.product, i.stripe_subscription_id);
  end loop;
  return true;
end;
$$;

revoke all on function public.course_paid_state(uuid, text, text) from public, anon, authenticated;
revoke all on function public.refresh_course_paid(uuid, text, text) from public, anon, authenticated;
revoke all on function public.lock_course_payment_book() from public, anon, authenticated;
revoke all on function public.apply_course_payment(text, uuid, text, timestamptz, text, text) from public, anon, authenticated;
revoke all on function public.apply_course_payment_link(text, text, text[]) from public, anon, authenticated;
revoke all on function public.apply_course_reversal(text, bigint, text, text, text[], boolean, boolean) from public, anon, authenticated;
grant execute on function public.apply_course_payment(text, uuid, text, timestamptz, text, text) to service_role;
grant execute on function public.apply_course_payment_link(text, text, text[]) to service_role;
grant execute on function public.apply_course_reversal(text, bigint, text, text, text[], boolean, boolean) to service_role;
