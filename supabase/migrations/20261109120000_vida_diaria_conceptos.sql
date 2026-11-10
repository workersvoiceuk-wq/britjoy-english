-- «Inglés para el día a día» · dos conceptos con IVA incluido: curso (£12/mes) y orientación básica escrita (£8/mes,
-- solo junto al curso). La comprobación de cada factura (pagada, GBP, importes exactos por concepto, suma = total) la
-- hace paymentFromEvent() en _shared/vida-diaria.ts antes de llamar a apply_course_payment; aquí se guarda qué periodo
-- de curso y qué periodo de orientación pagó cada factura.
--
-- Aditiva: columnas con valor por defecto o nulas. Sustituye solo funciones del curso (apply_course_access gana
-- p_orientation y apply_course_payment gana p_orientation_until). No toca profiles, plus_until, créditos ni Academy.

-- Una factura solo de prorrateo de orientación no paga un periodo de curso.
alter table public.course_invoices alter column paid_until drop not null;
alter table public.course_invoices add column orientation_until timestamptz;
alter table public.course_access add column orientation boolean not null default false;
alter table public.course_access add column orientation_until timestamptz;

-- Mismo cálculo que paidUntilFor(): curso y orientación entre las facturas sin reversión activa.
drop function public.course_paid_state(uuid, text, text);
create function public.course_paid_state(p_user uuid, p_product text, p_subscription text,
  out paid_until timestamptz, out reversed boolean, out orientation_until timestamptz)
language sql stable security definer set search_path = '' as $$
  with inv as (
    select i.paid_until, i.orientation_until, exists (
      select 1 from public.course_payment_reversals r
      join public.course_payment_links l on l.payment_ref = any (r.refs)
      where r.active and l.stripe_invoice_id = i.stripe_invoice_id
    ) as rev
    from public.course_invoices i
    where i.user_id = p_user and i.product = p_product and i.stripe_subscription_id = p_subscription
  )
  select (select max(inv.paid_until) from inv where not inv.rev),
         coalesce((select inv.rev from inv where inv.paid_until is not null order by inv.paid_until desc limit 1), false),
         (select max(inv.orientation_until) from inv where not inv.rev);
$$;
revoke all on function public.course_paid_state(uuid, text, text) from public, anon, authenticated;

create or replace function public.refresh_course_paid(p_user uuid, p_product text, p_subscription text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  s record;
begin
  select * into s from public.course_paid_state(p_user, p_product, p_subscription);
  update public.course_access as a set paid_until = s.paid_until, payment_reversed = s.reversed,
    orientation_until = s.orientation_until, updated_at = now()
    where a.user_id = p_user and a.product = p_product and a.stripe_subscription_id = p_subscription;
end;
$$;

drop function public.apply_course_access(text, bigint, uuid, text, text, timestamptz, boolean, text, text);
create function public.apply_course_access(
  p_event text, p_event_created bigint, p_user uuid, p_product text, p_status text,
  p_access_until timestamptz, p_cancel boolean, p_subscription text, p_customer text, p_orientation boolean
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
    orientation = coalesce(p_orientation, false),
    orientation_until = s.orientation_until,
    last_event_created = p_event_created,
    updated_at = now()
  where a.user_id = p_user and a.product = p_product;
  return true;
end;
$$;

drop function public.apply_course_payment(text, uuid, text, timestamptz, text, text);
-- invoice.paid ya comprobado: una vez por evento y una vez por factura. p_paid_until es null si la factura solo pagó
-- un prorrateo de orientación; al menos uno de los dos periodos debe venir.
create function public.apply_course_payment(p_event text, p_user uuid, p_product text, p_paid_until timestamptz,
  p_subscription text, p_invoice text, p_orientation_until timestamptz)
returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if p_subscription is null or p_invoice is null or (p_paid_until is null and p_orientation_until is null) then
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
  insert into public.course_invoices (stripe_invoice_id, user_id, product, stripe_subscription_id, paid_until, orientation_until)
    values (p_invoice, p_user, p_product, p_subscription, p_paid_until, p_orientation_until)
    on conflict (stripe_invoice_id) do nothing;
  perform public.refresh_course_paid(p_user, p_product, p_subscription);
  return true;
end;
$$;

revoke all on function public.apply_course_access(text, bigint, uuid, text, text, timestamptz, boolean, text, text, boolean) from public, anon, authenticated;
revoke all on function public.apply_course_payment(text, uuid, text, timestamptz, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.apply_course_access(text, bigint, uuid, text, text, timestamptz, boolean, text, text, boolean) to service_role;
grant execute on function public.apply_course_payment(text, uuid, text, timestamptz, text, text, timestamptz) to service_role;
