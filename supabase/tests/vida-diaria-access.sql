-- «Inglés para el día a día» · prueba de la migración 20261107120000 en PostgreSQL local (sin Supabase).
-- Ejecuta: scripts/test-vida-diaria-sql.sh (crea una base temporal con stubs de auth/storage y aplica las migraciones).
\set ON_ERROR_STOP 1
insert into auth.users (id, email, email_confirmed_at) values
 ('00000000-0000-4000-8000-00000000000a','a@example.com',now()),('00000000-0000-4000-8000-00000000000b','b@example.com',now());
insert into public.profiles (id) values ('00000000-0000-4000-8000-00000000000a'),('00000000-0000-4000-8000-00000000000b') on conflict do nothing;
set role service_role;
do $$ begin
  assert public.apply_course_access('evt_1', 100, '00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', 'active', now() + interval '30 days', false, 'sub_1', 'cus_1'), 'compra';
  assert not public.apply_course_access('evt_1', 100, '00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', 'active', now() + interval '30 days', false, 'sub_1', 'cus_1'), 'reintento';
  assert public.apply_course_access('evt_2', 200, '00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', 'active', now() + interval '30 days', true, 'sub_1', null), 'cancelar al final';
  assert not public.apply_course_access('evt_0', 50, '00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', 'canceled', null, false, 'sub_1', null), 'antiguo tarde';
  assert not public.apply_course_access('evt_x', 300, '00000000-0000-4000-8000-0000000000ff', 'vida_diaria_monthly', 'active', now(), false, 'sub_x', null), 'usuario inexistente';
  assert (select status = 'active' and cancel_at_period_end and access_until > now() and stripe_customer_id = 'cus_1' and last_event_created = 200 from public.course_access), 'fila A';
  assert (select plus_until is null from public.profiles where id = '00000000-0000-4000-8000-00000000000a'), 'VUM Academy sin tocar';
end $$;
-- invoice.paid: paid_until avanza, no retrocede, una vez por evento.
do $$ begin
  assert public.apply_course_payment('evt_p1', '00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', now() + interval '30 days', 'sub_1'), 'pago';
  assert not public.apply_course_payment('evt_p1', '00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', now() + interval '30 days', 'sub_1'), 'pago repetido';
  assert public.apply_course_payment('evt_p0', '00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', now() + interval '1 day', 'sub_1'), 'pago antiguo tarde';
  assert (select paid_until > now() + interval '29 days' from public.course_access where user_id = '00000000-0000-4000-8000-00000000000a'), 'paid_until no retrocede';
  -- pago antes que la suscripción (otro alumno): fila pendiente
  assert public.apply_course_payment('evt_pb', '00000000-0000-4000-8000-00000000000b', 'vida_diaria_monthly', now() + interval '30 days', 'sub_b'), 'pago B';
  assert (select status = 'incomplete' and access_until is null from public.course_access where user_id = '00000000-0000-4000-8000-00000000000b'), 'B pendiente';
end $$;
-- Checkout: una sesión por alumno; mismo intento hasta registrar; reutilizar; recuperar al caducar.
do $$
declare r record;
begin
  select * into r from public.begin_course_checkout('00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly');
  assert r.action = 'create' and r.attempt = 1, 'primer intento';
  select * into r from public.begin_course_checkout('00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly');
  assert r.action = 'create' and r.attempt = 1, 'misma clave mientras no hay sesión';
  assert public.record_course_checkout('00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', 1, 'cs_1', 'https://x/1', now() + interval '1 hour'), 'registrar';
  select * into r from public.begin_course_checkout('00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly');
  assert r.action = 'reuse' and r.url = 'https://x/1', 'reutilizar';
  update public.course_checkout set expires_at = now() + interval '2 minutes';
  select * into r from public.begin_course_checkout('00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly');
  assert r.action = 'create' and r.attempt = 2, 'recuperar al caducar';
  assert public.record_course_checkout('00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', 1, 'cs_old', 'https://x/old', now() + interval '1 hour') is null, 'un intento viejo no pisa';
end $$;
reset role;
do $$ begin assert (select not public from storage.buckets where id = 'vida-diaria-premium'), 'bucket privado'; end $$;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000a';
do $$ begin assert (select count(*) = 1 and bool_and(user_id = '00000000-0000-4000-8000-00000000000a') from public.course_access), 'A solo ve la suya'; end $$;
do $$ begin assert (select count(*) = 0 from public.course_checkout), 'checkout invisible para el alumno'; end $$;
set request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000b';
do $$ begin assert (select count(*) = 1 and bool_and(user_id = '00000000-0000-4000-8000-00000000000b') from public.course_access), 'B solo ve la suya'; end $$;
reset role; set role anon;
do $$ begin assert (select count(*) = 0 from public.course_access), 'anon no ve nada'; end $$;
reset role;
select 'vida-diaria SQL: OK';
