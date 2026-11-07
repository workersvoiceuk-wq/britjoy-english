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

-- Contenido de pago (módulos 02–12, vídeos y subtítulos): bucket PRIVADO. Sin políticas para anon ni authenticated:
-- nadie puede leerlo con la clave pública ni con su sesión; solo la función vida-diaria (service role) tras
-- comprobar course_access. El dueño sube el paquete privado con scripts/upload-premium.mjs (fuera del repositorio).
insert into storage.buckets (id, name, public) values ('vida-diaria-premium', 'vida-diaria-premium', false)
  on conflict (id) do update set public = false;
