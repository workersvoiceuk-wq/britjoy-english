-- «Inglés para el día a día» · el checkout recuerda la oferta de la sesión abierta.
-- Antes: begin_course_checkout y la clave de idempotencia distinguían alumno, producto e intento, pero no la oferta, así
-- que con una sesión abierta de «curso» una petición de «curso_orientacion» recibía la URL de £12 (y al revés, la de £20).
-- Ahora sigue habiendo UNA sola sesión pagable por alumno, pero solo se reutiliza para la misma oferta. Otra oferta
-- recibe un conflicto; el cambio explícito caduca la sesión en Stripe y la libera con release_course_checkout.
-- Mismo criterio que planCheckout() en _shared/vida-diaria.ts. Aditiva: una columna nula y funciones del curso.

alter table public.course_checkout add column offer text check (offer in ('curso', 'curso_orientacion'));

drop function public.begin_course_checkout(uuid, text);
drop function public.record_course_checkout(uuid, text, integer, text, text, timestamptz);

-- Toma (con bloqueo por alumno) la decisión de Checkout para una oferta:
--   reuse    → sesión abierta de la MISMA oferta (misma URL);
--   create   → crear con este intento (y clave estable por alumno, intento y oferta);
--   conflict → otra oferta tiene la sesión abierta (other_offer) o la está creando ahora (in_progress).
-- Una creación de otra oferta que lleva más de 2 minutos sin registrarse (p. ej. Stripe falló) deja de bloquear.
create function public.begin_course_checkout(p_user uuid, p_product text, p_offer text)
returns table (action text, attempt integer, url text, offer text, session_id text, reason text)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v public.course_checkout%rowtype;
  v_held text;
begin
  if p_offer not in ('curso', 'curso_orientacion') then
    raise exception 'invalid offer';
  end if;
  insert into public.course_checkout (user_id, product, attempt, offer) values (p_user, p_product, 1, p_offer)
    on conflict (user_id, product) do nothing;
  select * into v from public.course_checkout c where c.user_id = p_user and c.product = p_product for update;
  v_held := coalesce(v.offer, 'curso');
  if v.url is not null and v.expires_at > now() then
    if v_held = p_offer then
      return query select 'reuse'::text, v.attempt, v.url, v_held, v.session_id, null::text;
    else
      return query select 'conflict'::text, v.attempt, null::text, v_held, v.session_id, 'other_offer'::text;
    end if;
  elsif v.session_id is null then
    if v_held = p_offer then
      return query select 'create'::text, v.attempt, null::text, v_held, null::text, null::text;
    elsif v.updated_at > now() - interval '2 minutes' then
      return query select 'conflict'::text, v.attempt, null::text, v_held, null::text, 'in_progress'::text;
    else
      update public.course_checkout c set offer = p_offer, updated_at = now() where c.user_id = p_user and c.product = p_product;
      return query select 'create'::text, v.attempt, null::text, p_offer, null::text, null::text;
    end if;
  else
    update public.course_checkout c set attempt = c.attempt + 1, session_id = null, url = null, expires_at = null, offer = p_offer, updated_at = now()
      where c.user_id = p_user and c.product = p_product;
    return query select 'create'::text, v.attempt + 1, null::text, p_offer, null::text, null::text;
  end if;
end;
$$;

-- Guarda la sesión creada para ese intento y esa oferta (si otro intento u otra oferta ya la sustituyó, no pisa nada).
create function public.record_course_checkout(p_user uuid, p_product text, p_attempt integer, p_offer text, p_session text, p_url text, p_expires timestamptz)
returns boolean
language sql security definer set search_path = '' as $$
  update public.course_checkout set session_id = p_session, url = p_url, expires_at = p_expires, updated_at = now()
    where user_id = p_user and product = p_product and attempt = p_attempt and coalesce(offer, 'curso') = p_offer
  returning true;
$$;

-- Tras caducar la sesión en Stripe (cambio explícito de oferta): la marca como terminada, solo si sigue siendo esa sesión.
create function public.release_course_checkout(p_user uuid, p_product text, p_session text)
returns boolean
language sql security definer set search_path = '' as $$
  update public.course_checkout set expires_at = now() - interval '1 second', updated_at = now()
    where user_id = p_user and product = p_product and session_id = p_session
  returning true;
$$;

revoke all on function public.begin_course_checkout(uuid, text, text) from public, anon, authenticated;
revoke all on function public.record_course_checkout(uuid, text, integer, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.release_course_checkout(uuid, text, text) from public, anon, authenticated;
grant execute on function public.begin_course_checkout(uuid, text, text) to service_role;
grant execute on function public.record_course_checkout(uuid, text, integer, text, text, text, timestamptz) to service_role;
grant execute on function public.release_course_checkout(uuid, text, text) to service_role;
