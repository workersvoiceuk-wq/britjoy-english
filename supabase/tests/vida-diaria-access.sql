-- «Inglés para el día a día» · prueba de la migración 20261107120000 en PostgreSQL local (sin Supabase).
-- Ejecuta: scripts/test-vida-diaria-sql.sh (crea una base temporal con stubs de auth/storage y aplica las migraciones).
\set ON_ERROR_STOP 1
insert into auth.users (id, email, email_confirmed_at) values
 ('00000000-0000-4000-8000-00000000000a','a@example.com',now()),('00000000-0000-4000-8000-00000000000b','b@example.com',now());
insert into public.profiles (id) values ('00000000-0000-4000-8000-00000000000a'),('00000000-0000-4000-8000-00000000000b') on conflict do nothing;
update public.profiles set stripe_customer_id = 'cus_academy' where id = '00000000-0000-4000-8000-00000000000a';
set role service_role;
do $$ begin
  assert public.apply_course_access('evt_1', 100, '00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', 'active', now() + interval '30 days', false, 'sub_1', 'cus_1'), 'compra';
  assert not public.apply_course_access('evt_1', 100, '00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', 'active', now() + interval '30 days', false, 'sub_1', 'cus_1'), 'reintento';
  assert public.apply_course_access('evt_2', 200, '00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', 'active', now() + interval '30 days', true, 'sub_1', null), 'cancelar al final';
  assert not public.apply_course_access('evt_0', 50, '00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', 'canceled', null, false, 'sub_1', null), 'antiguo tarde';
  assert not public.apply_course_access('evt_x', 300, '00000000-0000-4000-8000-0000000000ff', 'vida_diaria_monthly', 'active', now(), false, 'sub_x', null), 'usuario inexistente';
  assert (select status = 'active' and cancel_at_period_end and access_until > now() and stripe_customer_id = 'cus_1' and last_event_created = 200 from public.course_access), 'fila A';
  assert (select plus_until is null and stripe_customer_id = 'cus_academy' from public.profiles where id = '00000000-0000-4000-8000-00000000000a'), 'VUM Academy conserva su cliente';
end $$;
-- invoice.paid: paid_until avanza, no retrocede, una vez por evento y por factura.
do $$ begin
  assert public.apply_course_payment('evt_p1', '00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', now() + interval '30 days', 'sub_1', 'in_evt_p1'), 'pago';
  assert not public.apply_course_payment('evt_p1', '00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', now() + interval '30 days', 'sub_1', 'in_evt_p1'), 'pago repetido';
  assert public.apply_course_payment('evt_p0', '00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', now() + interval '1 day', 'sub_1', 'in_evt_p0'), 'pago antiguo tarde';
  assert (select paid_until > now() + interval '29 days' from public.course_access where user_id = '00000000-0000-4000-8000-00000000000a'), 'paid_until no retrocede';
  -- pago antes que la suscripción (otro alumno): fila pendiente
  assert public.apply_course_payment('evt_pb', '00000000-0000-4000-8000-00000000000b', 'vida_diaria_monthly', now() + interval '30 days', 'sub_b', 'in_evt_pb'), 'pago B';
  assert (select stripe_customer_id is null from public.profiles where id = '00000000-0000-4000-8000-00000000000b'), 'Vida Diaria no asigna el cliente al perfil general';
  assert (select status = 'incomplete' and access_until is null from public.course_access where user_id = '00000000-0000-4000-8000-00000000000b'), 'B pendiente';
  -- Cambiar de suscripción requiere la factura de la nueva alta, en cualquier orden.
  assert public.apply_course_access('evt_new_a', 350, '00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', 'active', now() + interval '30 days', false, 'sub_new_a', 'cus_1'), 'nueva alta A';
  assert public.apply_course_payment('evt_old_a_late', '00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', now() + interval '40 days', 'sub_1', 'in_evt_old_a_late'), 'factura anterior tardía';
  assert (select paid_until is null from public.course_access where user_id = '00000000-0000-4000-8000-00000000000a'), 'la factura anterior no desbloquea la nueva alta';
  assert public.apply_course_payment('evt_new_a_paid', '00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', now() + interval '10 days', 'sub_new_a', 'in_evt_new_a_paid'), 'factura propia de A';
  assert (select paid_until = now() + interval '10 days' from public.course_access where user_id = '00000000-0000-4000-8000-00000000000a'), 'solo la fecha de la nueva factura';
  assert public.apply_course_payment('evt_new_b_paid_first', '00000000-0000-4000-8000-00000000000b', 'vida_diaria_monthly', now() + interval '20 days', 'sub_new_b', 'in_evt_new_b_paid_first'), 'factura B antes del alta';
  assert public.apply_course_access('evt_new_b', 350, '00000000-0000-4000-8000-00000000000b', 'vida_diaria_monthly', 'active', now() + interval '30 days', false, 'sub_new_b', 'cus_b'), 'nueva alta B';
  assert (select paid_until = now() + interval '20 days' from public.course_access where user_id = '00000000-0000-4000-8000-00000000000b'), 'se recupera la factura previa al alta';
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
  assert r.action = 'reuse', 'reutilizar mientras la sesión aún pueda cobrar';
  update public.course_checkout set expires_at = now() - interval '1 second';
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
-- Reembolsos y disputas (migración 20261108120000): solo cae el periodo de la factura afectada.
insert into auth.users (id, email, email_confirmed_at) values
 ('00000000-0000-4000-8000-0000000000d1','d1@example.com',now()),('00000000-0000-4000-8000-0000000000d2','d2@example.com',now());
set role service_role;
do $$
declare
  u1 constant uuid := '00000000-0000-4000-8000-0000000000d1';
  u2 constant uuid := '00000000-0000-4000-8000-0000000000d2';
  p constant text := 'vida_diaria_monthly';
begin
  -- U1: el reembolso completo llega ANTES que el enlace, la factura y el alta (orden inverso).
  assert public.apply_course_reversal('evt_r1', 900, 'refund:ch_u1_1', 'refund', array['ch_u1_1','pi_u1_1'], true), 'reembolso primero';
  assert public.apply_course_payment_link('evt_l1', 'in_u1_1', array['pi_u1_1']), 'enlace';
  assert public.apply_course_payment('evt_i1', u1, p, now() + interval '30 days', 'sub_u1', 'in_u1_1'), 'factura';
  assert public.apply_course_access('evt_s1', 800, u1, p, 'active', now() + interval '30 days', false, 'sub_u1', 'cus_u1'), 'alta';
  assert (select paid_until is null and payment_reversed from public.course_access where user_id = u1), 'U1 cerrada aunque el reembolso llegó primero';
  -- U2: alta pagada normal.
  perform public.apply_course_access('evt_s2', 800, u2, p, 'active', now() + interval '30 days', false, 'sub_u2', 'cus_u2');
  perform public.apply_course_payment('evt_i2', u2, p, now() + interval '30 days', 'sub_u2', 'in_u2_1');
  perform public.apply_course_payment_link('evt_l2', 'in_u2_1', array['pi_u2_1']);
  assert (select paid_until > now() and not payment_reversed from public.course_access where user_id = u2), 'U2 abierta: el reembolso de U1 no la toca';
  -- Duplicados: mismo evento → false; la misma factura reenviada con otro evento no reabre.
  assert not public.apply_course_reversal('evt_r1', 900, 'refund:ch_u1_1', 'refund', array['ch_u1_1','pi_u1_1'], true), 'reembolso repetido';
  assert not public.apply_course_payment_link('evt_l1', 'in_u1_1', array['pi_u1_1']), 'enlace repetido';
  assert public.apply_course_payment('evt_i1_again', u1, p, now() + interval '30 days', 'sub_u1', 'in_u1_1'), 'factura reenviada';
  assert (select paid_until is null from public.course_access where user_id = u1), 'la factura reembolsada reenviada no reabre';
  -- Reembolso parcial de U2: no cierra.
  perform public.apply_course_reversal('evt_rp', 950, 'refund:ch_u2_1', 'refund', array['ch_u2_1','pi_u2_1'], false);
  assert (select paid_until > now() from public.course_access where user_id = u2), 'parcial no cierra';
  -- Un cargo de otro producto (sin factura del curso) no cambia nada.
  perform public.apply_course_payment_link('evt_lx', 'in_academy', array['pi_academy']);
  perform public.apply_course_reversal('evt_rx', 901, 'refund:ch_academy', 'refund', array['ch_academy','pi_academy'], true);
  assert (select paid_until > now() from public.course_access where user_id = u2), 'Academy no toca el curso';
  -- Renovación posterior pagada de U1: vuelve a abrir hasta el nuevo periodo.
  perform public.apply_course_access('evt_s1b', 950, u1, p, 'active', now() + interval '60 days', false, 'sub_u1', null);
  perform public.apply_course_payment('evt_i1b', u1, p, now() + interval '60 days', 'sub_u1', 'in_u1_2');
  perform public.apply_course_payment_link('evt_l1b', 'in_u1_2', array['pi_u1_2']);
  assert (select paid_until > now() + interval '59 days' and not payment_reversed from public.course_access where user_id = u1), 'renovación posterior abre';
  -- Disputa del periodo vigente de U2: abierta cierra; ganada reabre; un estado antiguo tardío no pisa.
  assert public.apply_course_reversal('evt_d1', 1000, 'dispute:dp_1', 'dispute', array['ch_u2_1','pi_u2_1'], true), 'disputa abierta';
  assert (select paid_until is null and payment_reversed from public.course_access where user_id = u2), 'disputa abierta cierra';
  assert public.apply_course_reversal('evt_d3', 1200, 'dispute:dp_1', 'dispute', array['ch_u2_1','pi_u2_1'], false), 'disputa ganada';
  assert not public.apply_course_reversal('evt_d2', 1100, 'dispute:dp_1', 'dispute', array['ch_u2_1','pi_u2_1'], true), 'estado antiguo tardío';
  assert (select paid_until > now() and not payment_reversed from public.course_access where user_id = u2), 'ganada reabre';
  -- Alerta de fraude: se registra sin cambiar el acceso.
  assert public.apply_course_reversal('evt_f1', 1300, 'efw:issfr_1', 'fraud_warning', array['ch_u2_1','pi_u2_1'], false), 'alerta de fraude';
  assert (select paid_until > now() from public.course_access where user_id = u2), 'la alerta sola no cierra';
  -- Las cuentas de la primera parte conservan su estado.
  assert (select paid_until > now() + interval '19 days' and not payment_reversed from public.course_access where user_id = '00000000-0000-4000-8000-00000000000b'), 'B intacta';
end $$;
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000d1';
do $$ begin
  assert (select count(*) = 0 from public.course_invoices), 'facturas invisibles para el alumno';
  assert (select count(*) = 0 from public.course_payment_links), 'enlaces invisibles para el alumno';
  assert (select count(*) = 0 from public.course_payment_reversals), 'reversiones invisibles para el alumno';
end $$;
reset role;
select 'vida-diaria SQL: OK';
