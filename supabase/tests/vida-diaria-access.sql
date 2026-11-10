-- «Inglés para el día a día» · prueba de la migración 20261107120000 en PostgreSQL local (sin Supabase).
-- Ejecuta: scripts/test-vida-diaria-sql.sh (crea una base temporal con stubs de auth/storage y aplica las migraciones).
\set ON_ERROR_STOP 1
insert into auth.users (id, email, email_confirmed_at) values
 ('00000000-0000-4000-8000-00000000000a','a@example.com',now()),('00000000-0000-4000-8000-00000000000b','b@example.com',now());
insert into public.profiles (id) values ('00000000-0000-4000-8000-00000000000a'),('00000000-0000-4000-8000-00000000000b') on conflict do nothing;
update public.profiles set stripe_customer_id = 'cus_academy' where id = '00000000-0000-4000-8000-00000000000a';
set role service_role;
do $$ begin
  assert public.apply_course_access('evt_1', 100, '00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', 'active', now() + interval '30 days', false, 'sub_1', 'cus_1', false), 'compra';
  assert not public.apply_course_access('evt_1', 100, '00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', 'active', now() + interval '30 days', false, 'sub_1', 'cus_1', false), 'reintento';
  assert public.apply_course_access('evt_2', 200, '00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', 'active', now() + interval '30 days', true, 'sub_1', null, false), 'cancelar al final';
  assert not public.apply_course_access('evt_0', 50, '00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', 'canceled', null, false, 'sub_1', null, false), 'antiguo tarde';
  assert not public.apply_course_access('evt_x', 300, '00000000-0000-4000-8000-0000000000ff', 'vida_diaria_monthly', 'active', now(), false, 'sub_x', null, false), 'usuario inexistente';
  assert (select status = 'active' and cancel_at_period_end and access_until > now() and stripe_customer_id = 'cus_1' and last_event_created = 200 from public.course_access), 'fila A';
  assert (select plus_until is null and stripe_customer_id = 'cus_academy' from public.profiles where id = '00000000-0000-4000-8000-00000000000a'), 'VUM Academy conserva su cliente';
end $$;
-- invoice.paid: paid_until avanza, no retrocede, una vez por evento y por factura.
do $$ begin
  assert public.apply_course_payment('evt_p1', '00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', now() + interval '30 days', 'sub_1', 'in_evt_p1', null), 'pago';
  assert not public.apply_course_payment('evt_p1', '00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', now() + interval '30 days', 'sub_1', 'in_evt_p1', null), 'pago repetido';
  assert public.apply_course_payment('evt_p0', '00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', now() + interval '1 day', 'sub_1', 'in_evt_p0', null), 'pago antiguo tarde';
  assert (select paid_until > now() + interval '29 days' from public.course_access where user_id = '00000000-0000-4000-8000-00000000000a'), 'paid_until no retrocede';
  -- pago antes que la suscripción (otro alumno): fila pendiente
  assert public.apply_course_payment('evt_pb', '00000000-0000-4000-8000-00000000000b', 'vida_diaria_monthly', now() + interval '30 days', 'sub_b', 'in_evt_pb', null), 'pago B';
  assert (select stripe_customer_id is null from public.profiles where id = '00000000-0000-4000-8000-00000000000b'), 'Vida Diaria no asigna el cliente al perfil general';
  assert (select status = 'incomplete' and access_until is null from public.course_access where user_id = '00000000-0000-4000-8000-00000000000b'), 'B pendiente';
  -- Cambiar de suscripción requiere la factura de la nueva alta, en cualquier orden.
  assert public.apply_course_access('evt_new_a', 350, '00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', 'active', now() + interval '30 days', false, 'sub_new_a', 'cus_1', false), 'nueva alta A';
  assert public.apply_course_payment('evt_old_a_late', '00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', now() + interval '40 days', 'sub_1', 'in_evt_old_a_late', null), 'factura anterior tardía';
  assert (select paid_until is null from public.course_access where user_id = '00000000-0000-4000-8000-00000000000a'), 'la factura anterior no desbloquea la nueva alta';
  assert public.apply_course_payment('evt_new_a_paid', '00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', now() + interval '10 days', 'sub_new_a', 'in_evt_new_a_paid', null), 'factura propia de A';
  assert (select paid_until = now() + interval '10 days' from public.course_access where user_id = '00000000-0000-4000-8000-00000000000a'), 'solo la fecha de la nueva factura';
  assert public.apply_course_payment('evt_new_b_paid_first', '00000000-0000-4000-8000-00000000000b', 'vida_diaria_monthly', now() + interval '20 days', 'sub_new_b', 'in_evt_new_b_paid_first', null), 'factura B antes del alta';
  assert public.apply_course_access('evt_new_b', 350, '00000000-0000-4000-8000-00000000000b', 'vida_diaria_monthly', 'active', now() + interval '30 days', false, 'sub_new_b', 'cus_b', false), 'nueva alta B';
  assert (select paid_until = now() + interval '20 days' from public.course_access where user_id = '00000000-0000-4000-8000-00000000000b'), 'se recupera la factura previa al alta';
end $$;
-- Checkout: una sesión por alumno; mismo intento hasta registrar; reutilizar; recuperar al caducar.
do $$
declare r record;
begin
  select * into r from public.begin_course_checkout('00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', 'curso');
  assert r.action = 'create' and r.attempt = 1, 'primer intento';
  select * into r from public.begin_course_checkout('00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', 'curso');
  assert r.action = 'create' and r.attempt = 1, 'misma clave mientras no hay sesión';
  assert public.record_course_checkout('00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', 1, 'curso', 'cs_1', 'https://x/1', now() + interval '1 hour'), 'registrar';
  select * into r from public.begin_course_checkout('00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', 'curso');
  assert r.action = 'reuse' and r.url = 'https://x/1', 'reutilizar';
  update public.course_checkout set expires_at = now() + interval '2 minutes';
  select * into r from public.begin_course_checkout('00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', 'curso');
  assert r.action = 'reuse', 'reutilizar mientras la sesión aún pueda cobrar';
  update public.course_checkout set expires_at = now() - interval '1 second';
  select * into r from public.begin_course_checkout('00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', 'curso');
  assert r.action = 'create' and r.attempt = 2, 'recuperar al caducar';
  assert public.record_course_checkout('00000000-0000-4000-8000-00000000000a', 'vida_diaria_monthly', 1, 'curso', 'cs_old', 'https://x/old', now() + interval '1 hour') is null, 'un intento viejo no pisa';
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
  assert public.apply_course_reversal('evt_r1', 900, 'refund:ch_u1_1', 'refund', array['ch_u1_1','pi_u1_1'], true, false), 'reembolso primero';
  assert public.apply_course_payment_link('evt_l1', 'in_u1_1', array['pi_u1_1']), 'enlace';
  assert public.apply_course_payment('evt_i1', u1, p, now() + interval '30 days', 'sub_u1', 'in_u1_1', null), 'factura';
  assert public.apply_course_access('evt_s1', 800, u1, p, 'active', now() + interval '30 days', false, 'sub_u1', 'cus_u1', false), 'alta';
  assert (select paid_until is null and payment_reversed from public.course_access where user_id = u1), 'U1 cerrada aunque el reembolso llegó primero';
  -- U2: alta pagada normal.
  perform public.apply_course_access('evt_s2', 800, u2, p, 'active', now() + interval '30 days', false, 'sub_u2', 'cus_u2', false);
  perform public.apply_course_payment('evt_i2', u2, p, now() + interval '30 days', 'sub_u2', 'in_u2_1', null);
  perform public.apply_course_payment_link('evt_l2', 'in_u2_1', array['pi_u2_1']);
  assert (select paid_until > now() and not payment_reversed from public.course_access where user_id = u2), 'U2 abierta: el reembolso de U1 no la toca';
  -- Duplicados: mismo evento → false; la misma factura reenviada con otro evento no reabre.
  assert not public.apply_course_reversal('evt_r1', 900, 'refund:ch_u1_1', 'refund', array['ch_u1_1','pi_u1_1'], true, false), 'reembolso repetido';
  assert not public.apply_course_payment_link('evt_l1', 'in_u1_1', array['pi_u1_1']), 'enlace repetido';
  assert public.apply_course_payment('evt_i1_again', u1, p, now() + interval '30 days', 'sub_u1', 'in_u1_1', null), 'factura reenviada';
  assert (select paid_until is null from public.course_access where user_id = u1), 'la factura reembolsada reenviada no reabre';
  -- Reembolso parcial de U2: no cierra.
  perform public.apply_course_reversal('evt_rp', 950, 'refund:ch_u2_1', 'refund', array['ch_u2_1','pi_u2_1'], false, false);
  assert (select paid_until > now() from public.course_access where user_id = u2), 'parcial no cierra';
  -- Un cargo de otro producto (sin factura del curso) no cambia nada.
  perform public.apply_course_payment_link('evt_lx', 'in_academy', array['pi_academy']);
  perform public.apply_course_reversal('evt_rx', 901, 'refund:ch_academy', 'refund', array['ch_academy','pi_academy'], true, false);
  assert (select paid_until > now() from public.course_access where user_id = u2), 'Academy no toca el curso';
  -- Renovación posterior pagada de U1: vuelve a abrir hasta el nuevo periodo.
  perform public.apply_course_access('evt_s1b', 950, u1, p, 'active', now() + interval '60 days', false, 'sub_u1', null, false);
  perform public.apply_course_payment('evt_i1b', u1, p, now() + interval '60 days', 'sub_u1', 'in_u1_2', null);
  perform public.apply_course_payment_link('evt_l1b', 'in_u1_2', array['pi_u1_2']);
  assert (select paid_until > now() + interval '59 days' and not payment_reversed from public.course_access where user_id = u1), 'renovación posterior abre';
  -- Disputa del periodo vigente de U2: abierta cierra; ganada reabre; un estado antiguo tardío no pisa.
  assert public.apply_course_reversal('evt_d1', 1000, 'dispute:dp_1', 'dispute', array['ch_u2_1','pi_u2_1'], true, false), 'disputa abierta';
  assert (select paid_until is null and payment_reversed from public.course_access where user_id = u2), 'disputa abierta cierra';
  assert public.apply_course_reversal('evt_d3', 1200, 'dispute:dp_1', 'dispute', array['ch_u2_1','pi_u2_1'], false, true), 'disputa ganada';
  assert not public.apply_course_reversal('evt_d2', 1100, 'dispute:dp_1', 'dispute', array['ch_u2_1','pi_u2_1'], true, false), 'estado antiguo tardío';
  assert (select paid_until > now() and not payment_reversed from public.course_access where user_id = u2), 'ganada reabre';
  -- Alerta de fraude: se registra sin cambiar el acceso.
  assert public.apply_course_reversal('evt_f1', 1300, 'efw:issfr_1', 'fraud_warning', array['ch_u2_1','pi_u2_1'], false, false), 'alerta de fraude';
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
-- Disputas con el mismo event.created: el cierre terminal precede a la apertura (#issuecomment-6728269789).
insert into auth.users (id, email, email_confirmed_at) values
 ('00000000-0000-4000-8000-0000000000e1','e1@example.com',now()),('00000000-0000-4000-8000-0000000000e2','e2@example.com',now()),
 ('00000000-0000-4000-8000-0000000000e3','e3@example.com',now()),('00000000-0000-4000-8000-0000000000e4','e4@example.com',now()),
 ('00000000-0000-4000-8000-0000000000e5','e5@example.com',now());
set role service_role;
do $$
declare
  p constant text := 'vida_diaria_monthly';
  u uuid;
  k text;
begin
  -- Cinco alumnos con alta pagada; cada uno recibe una disputa sobre su propio pago.
  for i in 1..5 loop
    u := ('00000000-0000-4000-8000-0000000000e' || i)::uuid; k := 'e' || i;
    perform public.apply_course_access('evt_s_' || k, 800, u, p, 'active', now() + interval '30 days', false, 'sub_' || k, 'cus_' || k, false);
    perform public.apply_course_payment('evt_i_' || k, u, p, now() + interval '30 days', 'sub_' || k, 'in_' || k, null);
    perform public.apply_course_payment_link('evt_l_' || k, 'in_' || k, array['pi_' || k]);
  end loop;
  -- e1: won antes que needs_response, mismo segundo → abierto (la regresión reproducida).
  assert public.apply_course_reversal('evt_e1_closed', 2000, 'dispute:dp_e1', 'dispute', array['ch_e1','pi_e1'], false, true), 'e1 cierre';
  assert not public.apply_course_reversal('evt_e1_open', 2000, 'dispute:dp_e1', 'dispute', array['ch_e1','pi_e1'], true, false), 'e1 apertura del mismo segundo descartada';
  assert not public.apply_course_reversal('evt_e1_upd', 2000, 'dispute:dp_e1', 'dispute', array['ch_e1','pi_e1'], true, false), 'e1 actualización del mismo segundo descartada';
  assert (select paid_until > now() and not payment_reversed from public.course_access where user_id = '00000000-0000-4000-8000-0000000000e1'), 'e1 abierto';
  -- e2: orden normal, won → abierto.
  assert public.apply_course_reversal('evt_e2_open', 2000, 'dispute:dp_e2', 'dispute', array['ch_e2','pi_e2'], true, false), 'e2 apertura';
  assert public.apply_course_reversal('evt_e2_closed', 2000, 'dispute:dp_e2', 'dispute', array['ch_e2','pi_e2'], false, true), 'e2 cierre del mismo segundo';
  assert (select paid_until > now() from public.course_access where user_id = '00000000-0000-4000-8000-0000000000e2'), 'e2 abierto';
  -- e3: lost antes que needs_response, mismo segundo → cerrado; e4: lost en orden normal → cerrado.
  assert public.apply_course_reversal('evt_e3_closed', 2000, 'dispute:dp_e3', 'dispute', array['ch_e3','pi_e3'], true, true), 'e3 cierre';
  assert not public.apply_course_reversal('evt_e3_open', 2000, 'dispute:dp_e3', 'dispute', array['ch_e3','pi_e3'], true, false), 'e3 apertura descartada';
  assert (select paid_until is null and payment_reversed from public.course_access where user_id = '00000000-0000-4000-8000-0000000000e3'), 'e3 cerrado';
  perform public.apply_course_reversal('evt_e4_open', 2000, 'dispute:dp_e4', 'dispute', array['ch_e4','pi_e4'], true, false);
  perform public.apply_course_reversal('evt_e4_closed', 2000, 'dispute:dp_e4', 'dispute', array['ch_e4','pi_e4'], true, true);
  assert (select paid_until is null from public.course_access where user_id = '00000000-0000-4000-8000-0000000000e4'), 'e4 cerrado';
  -- e5: segundos distintos llegando al revés (cierre won 2002, actualización 2001, apertura 2000) → abierto;
  --     después un no terminal de un segundo POSTERIOR sí se aplica (cronología).
  assert public.apply_course_reversal('evt_e5_closed', 2002, 'dispute:dp_e5', 'dispute', array['ch_e5','pi_e5'], false, true), 'e5 cierre';
  assert not public.apply_course_reversal('evt_e5_upd', 2001, 'dispute:dp_e5', 'dispute', array['ch_e5','pi_e5'], true, false), 'e5 actualización antigua';
  assert not public.apply_course_reversal('evt_e5_open', 2000, 'dispute:dp_e5', 'dispute', array['ch_e5','pi_e5'], true, false), 'e5 apertura antigua';
  assert (select paid_until > now() from public.course_access where user_id = '00000000-0000-4000-8000-0000000000e5'), 'e5 abierto';
  -- Duplicados: el mismo evento no se aplica dos veces.
  assert not public.apply_course_reversal('evt_e5_closed', 2002, 'dispute:dp_e5', 'dispute', array['ch_e5','pi_e5'], false, true), 'e5 cierre repetido';
  assert public.apply_course_reversal('evt_e5_later', 2003, 'dispute:dp_e5', 'dispute', array['ch_e5','pi_e5'], true, false), 'e5 no terminal posterior';
  assert (select paid_until is null from public.course_access where user_id = '00000000-0000-4000-8000-0000000000e5'), 'e5 cronología';
  -- Un reembolso completo sigue cerrando aunque la disputa se ganara (e1).
  perform public.apply_course_reversal('evt_e1_refund', 2100, 'refund:ch_e1', 'refund', array['ch_e1','pi_e1'], true, false);
  assert (select paid_until is null from public.course_access where user_id = '00000000-0000-4000-8000-0000000000e1'), 'e1 reembolso cierra';
  -- La renovación pagada posterior de e1 vuelve a abrir.
  perform public.apply_course_access('evt_s_e1b', 2200, '00000000-0000-4000-8000-0000000000e1', p, 'active', now() + interval '60 days', false, 'sub_e1', null, false);
  perform public.apply_course_payment('evt_i_e1b', '00000000-0000-4000-8000-0000000000e1', p, now() + interval '60 days', 'sub_e1', 'in_e1_2', null);
  perform public.apply_course_payment_link('evt_l_e1b', 'in_e1_2', array['pi_e1_2']);
  assert (select paid_until > now() + interval '59 days' from public.course_access where user_id = '00000000-0000-4000-8000-0000000000e1'), 'e1 renovación abre';
end $$;
reset role;
-- Conceptos (migración 20261109120000): curso £12 y orientación £8; la factura ya llega comprobada.
insert into auth.users (id, email, email_confirmed_at) values ('00000000-0000-4000-8000-0000000000f1','f1@example.com',now());
set role service_role;
do $$
declare
  u constant uuid := '00000000-0000-4000-8000-0000000000f1';
  p constant text := 'vida_diaria_monthly';
begin
  assert public.apply_course_access('evt_of_s', 800, u, p, 'active', now() + interval '30 days', false, 'sub_f1', 'cus_f1', true), 'alta con orientación';
  assert not public.apply_course_payment('evt_of_none', u, p, null, 'sub_f1', 'in_none', null), 'sin periodo no cuenta';
  assert public.apply_course_payment('evt_of_i', u, p, now() + interval '30 days', 'sub_f1', 'in_f1', now() + interval '30 days'), 'factura £20';
  assert (select orientation and orientation_until > now() and paid_until > now() from public.course_access where user_id = u), 'curso y orientación pagados';
  -- Se quita la orientación: la fila la marca como no incluida.
  assert public.apply_course_access('evt_of_s2', 900, u, p, 'active', now() + interval '30 days', false, 'sub_f1', null, false), 'quitar orientación';
  assert (select not orientation and paid_until > now() from public.course_access where user_id = u), 'curso sigue sin orientación';
  -- Vuelve con prorrateo pagado solo de orientación: no alarga el curso.
  assert public.apply_course_access('evt_of_s3', 1000, u, p, 'active', now() + interval '30 days', false, 'sub_f1', null, true), 'añadir orientación';
  assert public.apply_course_payment('evt_of_up', u, p, null, 'sub_f1', 'in_up', now() + interval '30 days'), 'prorrateo de orientación';
  assert (select orientation and orientation_until > now() and paid_until < now() + interval '31 days' from public.course_access where user_id = u), 'prorrateo no alarga el curso';
  -- Reembolso completo de la factura de £20: cae ese periodo de curso; la orientación del prorrateo sigue contando.
  perform public.apply_course_payment_link('evt_of_l', 'in_f1', array['pi_f1']);
  perform public.apply_course_reversal('evt_of_r', 1100, 'refund:ch_f1', 'refund', array['ch_f1','pi_f1'], true, false);
  assert (select paid_until is null and payment_reversed from public.course_access where user_id = u), 'reembolso cierra el curso';
end $$;
reset role;
-- Checkout por oferta (migración 20261110120000): una sola sesión pagable y solo para su oferta.
insert into auth.users (id, email, email_confirmed_at) values ('00000000-0000-4000-8000-0000000000c1','c1@example.com',now()),('00000000-0000-4000-8000-0000000000c2','c2@example.com',now());
set role service_role;
do $$
declare
  u constant uuid := '00000000-0000-4000-8000-0000000000c1';
  p constant text := 'vida_diaria_monthly';
  r record;
begin
  -- curso abierto → curso_orientacion recibe conflicto, nunca la URL de £12
  select * into r from public.begin_course_checkout(u, p, 'curso');
  assert r.action = 'create' and r.attempt = 1 and r.offer = 'curso', 'crear curso';
  select * into r from public.begin_course_checkout(u, p, 'curso_orientacion');
  assert r.action = 'conflict' and r.reason = 'in_progress' and r.url is null, 'otra oferta mientras se crea';
  assert public.record_course_checkout(u, p, 1, 'curso', 'cs_c1', 'https://x/12', now() + interval '1 hour'), 'registrar curso';
  assert public.record_course_checkout(u, p, 1, 'curso_orientacion', 'cs_bad', 'https://x/bad', now() + interval '1 hour') is null, 'otra oferta no pisa';
  select * into r from public.begin_course_checkout(u, p, 'curso_orientacion');
  assert r.action = 'conflict' and r.reason = 'other_offer' and r.offer = 'curso' and r.session_id = 'cs_c1' and r.url is null, 'otra oferta con sesión abierta';
  select * into r from public.begin_course_checkout(u, p, 'curso');
  assert r.action = 'reuse' and r.url = 'https://x/12', 'misma oferta reutiliza';
  -- cambio explícito: tras caducar en Stripe se libera y se crea un intento nuevo con la otra oferta
  assert public.release_course_checkout(u, p, 'cs_otra') is null, 'liberar otra sesión no hace nada';
  assert public.release_course_checkout(u, p, 'cs_c1'), 'liberar la sesión caducada';
  select * into r from public.begin_course_checkout(u, p, 'curso_orientacion');
  assert r.action = 'create' and r.attempt = 2 and r.offer = 'curso_orientacion', 'nuevo intento con la otra oferta';
  assert public.record_course_checkout(u, p, 2, 'curso_orientacion', 'cs_c2', 'https://x/20', now() + interval '1 hour'), 'registrar £20';
  select * into r from public.begin_course_checkout(u, p, 'curso');
  assert r.action = 'conflict' and r.offer = 'curso_orientacion', 'orden inverso también en conflicto';
  -- creación de otra oferta que nunca se registró: deja de bloquear a los 2 minutos
  perform public.begin_course_checkout('00000000-0000-4000-8000-0000000000c2', p, 'curso');
  update public.course_checkout set updated_at = now() - interval '3 minutes' where user_id = '00000000-0000-4000-8000-0000000000c2';
  select * into r from public.begin_course_checkout('00000000-0000-4000-8000-0000000000c2', p, 'curso_orientacion');
  assert r.action = 'create' and r.attempt = 1 and r.offer = 'curso_orientacion', 'creación abandonada no bloquea';
  begin perform public.begin_course_checkout(u, p, 'orientacion'); assert false, 'oferta inválida'; exception when raise_exception then null; end;
end $$;
reset role;
select 'vida-diaria SQL: OK';
