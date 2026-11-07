-- «Inglés para el día a día» (producto vida_diaria_monthly): acceso de pago a un único curso, separado de
-- VUM Academy (profiles.plus_until) y de los créditos. No modifica ninguna tabla ni función existente: los contratos
-- vigentes no se migran.
--
-- Solo el webhook (service role) escribe, tras verificar la firma de Stripe; el alumno solo puede LEER su fila.

create table public.course_access (
  user_id uuid not null references auth.users (id) on delete cascade,
  product text not null check (product = 'vida_diaria_monthly'),
  status text not null,
  access_until timestamptz,
  cancel_at_period_end boolean not null default false,
  stripe_subscription_id text,
  stripe_customer_id text,
  last_event_created bigint not null default 0,
  -- Fin del último periodo EFECTIVAMENTE pagado (invoice.paid). El acceso nunca pasa de esta fecha.
  paid_until timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, product)
);

-- Una sesión de Checkout abierta por alumno: intento, sesión y caducidad. La clave de idempotencia de Stripe es
-- estable por (usuario, intento), así que dos peticiones simultáneas reciben la misma sesión.
create table public.course_checkout (
  user_id uuid not null references auth.users (id) on delete cascade,
  product text not null check (product = 'vida_diaria_monthly'),
  attempt integer not null default 1,
  session_id text,
  url text,
  expires_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, product)
);

-- Cada evento de Stripe del curso se aplica una sola vez.
create table public.course_access_events (
  stripe_event_id text primary key,
  user_id uuid references auth.users (id) on delete set null,
  product text not null,
  created_at timestamptz not null default now()
);

alter table public.course_access enable row level security;
alter table public.course_access_events enable row level security;
alter table public.course_checkout enable row level security; -- sin políticas: solo service role

create policy "read own course access" on public.course_access
  for select to authenticated using ((select auth.uid()) = user_id);

-- Aplica un cambio de suscripción: una vez por evento y nunca un evento más antiguo sobre uno más nuevo.
-- Devuelve true si cambió el acceso.
create function public.apply_course_access(
  p_event text, p_event_created bigint, p_user uuid, p_product text, p_status text,
  p_access_until timestamptz, p_cancel boolean, p_subscription text, p_customer text
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_prev bigint;
begin
  if not exists (select 1 from auth.users where id = p_user) then
    insert into public.course_access_events (stripe_event_id, user_id, product)
      values (p_event, null, p_product) on conflict (stripe_event_id) do nothing;
    return false;
  end if;
  insert into public.course_access_events (stripe_event_id, user_id, product)
    values (p_event, p_user, p_product) on conflict (stripe_event_id) do nothing;
  if not found then
    return false; -- ya aplicado
  end if;
  select last_event_created into v_prev from public.course_access
    where user_id = p_user and product = p_product for update;
  if v_prev is not null and v_prev > p_event_created then
    return false; -- evento antiguo que llega tarde
  end if;
  insert into public.course_access as a (user_id, product, status, access_until, cancel_at_period_end,
      stripe_subscription_id, stripe_customer_id, last_event_created, updated_at)
    values (p_user, p_product, p_status, p_access_until, coalesce(p_cancel, false), p_subscription, p_customer,
      p_event_created, now())
  on conflict (user_id, product) do update set
    status = excluded.status,
    access_until = excluded.access_until,
    cancel_at_period_end = excluded.cancel_at_period_end,
    stripe_subscription_id = excluded.stripe_subscription_id,
    stripe_customer_id = coalesce(excluded.stripe_customer_id, a.stripe_customer_id),
    last_event_created = excluded.last_event_created,
    updated_at = now();
  -- El mismo cliente de Stripe sirve para el portal (cancelar, recibos), sin tocar plus_until.
  update public.profiles set stripe_customer_id = coalesce(stripe_customer_id, p_customer) where id = p_user;
  return true;
end;
$$;

revoke all on function public.apply_course_access(text, bigint, uuid, text, text, timestamptz, boolean, text, text)
  from public, anon, authenticated;
grant execute on function public.apply_course_access(text, bigint, uuid, text, text, timestamptz, boolean, text, text)
  to service_role;

-- invoice.paid: avanza paid_until (nunca hacia atrás), una vez por evento.
create function public.apply_course_payment(p_event text, p_user uuid, p_product text, p_paid_until timestamptz, p_subscription text)
returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from auth.users where id = p_user) then
    insert into public.course_access_events (stripe_event_id, user_id, product) values (p_event, null, p_product)
      on conflict (stripe_event_id) do nothing;
    return false;
  end if;
  insert into public.course_access_events (stripe_event_id, user_id, product) values (p_event, p_user, p_product)
    on conflict (stripe_event_id) do nothing;
  if not found then
    return false;
  end if;
  insert into public.course_access as a (user_id, product, status, paid_until, stripe_subscription_id, updated_at)
    values (p_user, p_product, 'incomplete', p_paid_until, p_subscription, now())
  on conflict (user_id, product) do update set
    paid_until = greatest(coalesce(a.paid_until, excluded.paid_until), excluded.paid_until),
    updated_at = now();
  return true;
end;
$$;

-- Toma (con bloqueo por alumno) la decisión de Checkout: reutilizar la sesión abierta o crear con un intento.
-- Mismo criterio que planCheckout() en _shared/vida-diaria.ts.
create function public.begin_course_checkout(p_user uuid, p_product text, p_reuse_margin interval default interval '5 minutes')
returns table (action text, attempt integer, url text)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v public.course_checkout%rowtype;
begin
  insert into public.course_checkout (user_id, product, attempt) values (p_user, p_product, 1)
    on conflict (user_id, product) do nothing;
  select * into v from public.course_checkout c where c.user_id = p_user and c.product = p_product for update;
  if v.url is not null and v.expires_at is not null and v.expires_at - p_reuse_margin > now() then
    return query select 'reuse'::text, v.attempt, v.url;
  elsif v.session_id is null then
    return query select 'create'::text, v.attempt, null::text;
  else
    update public.course_checkout c set attempt = c.attempt + 1, session_id = null, url = null, expires_at = null, updated_at = now()
      where c.user_id = p_user and c.product = p_product;
    return query select 'create'::text, v.attempt + 1, null::text;
  end if;
end;
$$;

-- Guarda la sesión creada para ese intento (si otro intento ya la sustituyó, no pisa nada).
create function public.record_course_checkout(p_user uuid, p_product text, p_attempt integer, p_session text, p_url text, p_expires timestamptz)
returns boolean
language sql security definer set search_path = '' as $$
  update public.course_checkout set session_id = p_session, url = p_url, expires_at = p_expires, updated_at = now()
    where user_id = p_user and product = p_product and attempt = p_attempt
  returning true;
$$;

revoke all on function public.apply_course_payment(text, uuid, text, timestamptz, text) from public, anon, authenticated;
revoke all on function public.begin_course_checkout(uuid, text, interval) from public, anon, authenticated;
revoke all on function public.record_course_checkout(uuid, text, integer, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.apply_course_payment(text, uuid, text, timestamptz, text) to service_role;
grant execute on function public.begin_course_checkout(uuid, text, interval) to service_role;
grant execute on function public.record_course_checkout(uuid, text, integer, text, text, timestamptz) to service_role;

-- Contenido de pago (módulos 02–12, vídeos y subtítulos): bucket PRIVADO. Sin políticas para anon ni authenticated:
-- nadie puede leerlo con la clave pública ni con su sesión; solo la función vida-diaria (service role) tras
-- comprobar course_access. El dueño sube el paquete privado con scripts/upload-premium.mjs (fuera del repositorio).
insert into storage.buckets (id, name, public) values ('vida-diaria-premium', 'vida-diaria-premium', false)
  on conflict (id) do update set public = false;
