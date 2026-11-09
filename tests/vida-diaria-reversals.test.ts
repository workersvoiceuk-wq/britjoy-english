// «Inglés para el día a día» · reembolsos completos, disputas, alertas de fraude y renovación fallida (datos sintéticos).
// Reproduce la regresión de https://github.com/workersvoiceuk-wq/britjoy-english/pull/16#issuecomment-6727794168:
// en acf931a1 un reembolso completo de la factura pagada no revocaba el acceso si no llegaba otro evento de
// suscripción. Control negativo: con el contrato de acf931a1 (sin applyVidaDiariaEvent) estas pruebas fallan.
import { describe, expect, it } from 'vitest';
import * as vd from '../supabase/functions/_shared/vida-diaria';
import type { CourseAccessRow } from '../supabase/functions/_shared/vida-diaria';

const PRICE = 'price_test_vida_diaria';
const prices = vd.vdPriceIds(PRICE);
const DAY = 86_400;
const T0 = 1_794_000_000;
const P1 = T0 + 30 * DAY; // fin del primer periodo pagado
const P2 = P1 + 30 * DAY; // fin del segundo periodo

type Ev = { id: string; type: string; created: number; data: { object: unknown } };
let n = 0;
const ev = (type: string, created: number, object: unknown, id = `evt_r_${++n}`): Ev => ({ id, type, created, data: { object } });

const sub = (type: string, created: number, o: Partial<{ user: string; id: string; status: string; start: number; end: number }> = {}) =>
  ev(type, created, {
    id: o.id ?? `sub_${o.user ?? 'a'}`, status: o.status ?? 'active', customer: `cus_${o.user ?? 'a'}`, cancel_at_period_end: false, cancel_at: null,
    metadata: { user_id: o.user ?? 'a', product: vd.VD_PRODUCT },
    items: { data: [{ price: { id: PRICE }, current_period_start: o.start ?? (o.end ?? P1) - 30 * DAY, current_period_end: o.end ?? P1 }] },
  });
const invoicePaid = (created: number, invoice: string, end: number, o: Partial<{ user: string; sub: string }> = {}, id?: string) =>
  ev('invoice.paid', created, {
    id: invoice, status: 'paid', currency: 'gbp', total: 1200, amount_paid: 1200,
    parent: { subscription_details: { metadata: { user_id: o.user ?? 'a', product: vd.VD_PRODUCT }, subscription: o.sub ?? `sub_${o.user ?? 'a'}` } },
    lines: { data: [{ amount: 1200, currency: 'gbp', quantity: 1, period: { start: end - 30 * DAY, end }, pricing: { price_details: { price: PRICE } } }] },
  }, id);
const invoicePayment = (created: number, invoice: string, pi: string, id?: string) =>
  ev('invoice_payment.paid', created, { id: `inpay_${invoice}`, object: 'invoice_payment', invoice, status: 'paid', payment: { type: 'payment_intent', payment_intent: pi } }, id);
const refunded = (created: number, charge: string, pi: string, full = true, id?: string) =>
  ev('charge.refunded', created, { id: charge, object: 'charge', payment_intent: pi, amount: 1999, amount_captured: 1999, amount_refunded: full ? 1999 : 500, refunded: full }, id);
const dispute = (type: string, created: number, id: string, charge: string, pi: string, status: string) =>
  ev(type, created, { id, object: 'dispute', charge, payment_intent: pi, amount: 1999, reason: 'fraudulent', status });

/** Course webhook state (same contract as vida-diaria-webhook + its SQL functions). */
function server() {
  const rows = new Map<string, CourseAccessRow>();
  const seen = new Set<string>();
  const mod = vd as unknown as Record<string, (...a: unknown[]) => unknown>;
  const book = mod.newPaymentBook ? mod.newPaymentBook() : new Map();
  const apply = (e: Ev): boolean => {
    if (mod.applyVidaDiariaEvent) return mod.applyVidaDiariaEvent(rows, seen, book, e, prices) as boolean;
    // Contract at acf931a1 (negative control): only subscription events and invoice.paid exist.
    const p = vd.paymentFromEvent(e, prices);
    if (p) return mod.applyPayment(rows, seen, book, p) as boolean;
    const c = vd.accessChangeFromEvent(e, prices);
    return c ? (mod.applyAccessChange(rows, seen, book, c) as boolean) : false;
  };
  return {
    apply,
    all: (events: Ev[]) => events.forEach(apply),
    /** Alta pagada del primer periodo: suscripción + factura + enlace factura→PaymentIntent. */
    subscribe(user = 'a', invoice = `in_${user}_1`, pi = `pi_${user}_1`) {
      apply(sub('customer.subscription.created', T0, { user }));
      apply(invoicePaid(T0, invoice, P1, { user }));
      apply(invoicePayment(T0, invoice, pi));
    },
    row: (user = 'a') => rows.get(`${user}:${vd.VD_PRODUCT}`) ?? null,
    active: (user: string, at: number) => vd.accessStatus(rows.get(`${user}:${vd.VD_PRODUCT}`), at * 1000).active,
    status: (user: string, at: number) => vd.accessStatus(rows.get(`${user}:${vd.VD_PRODUCT}`), at * 1000),
    module: (user: string, id: string, at: number) => vd.decideModule(id, rows.get(`${user}:${vd.VD_PRODUCT}`), at * 1000),
  };
}

const NOW = T0 + 2 * DAY;

describe('Vida Diaria · reembolsos y disputas cierran solo el periodo de esa factura', () => {
  it('reembolso completo de la factura pagada: cierra el acceso aunque no llegue otro evento de suscripción', () => {
    const s = server();
    s.subscribe();
    expect(s.active('a', NOW)).toBe(true);
    expect(s.apply(refunded(NOW, 'ch_a_1', 'pi_a_1'))).toBe(true);
    expect(s.active('a', NOW)).toBe(false);
    expect(s.status('a', NOW)).toMatchObject({ active: false, status: 'expired', until: null });
    expect(s.module('a', '02-compras', NOW)).toBe('payment_required');
    expect(s.module('a', '01-presentaciones', NOW)).toBe('sample'); // la muestra sigue libre
    // Misma suscripción aún viva en Stripe: un segundo checkout cobraría dos veces.
    expect(vd.canStartCheckout(s.row(), NOW * 1000)).toBe(false);
    s.apply(sub('customer.subscription.deleted', NOW + 60, { status: 'canceled' }));
    expect(vd.canStartCheckout(s.row(), (NOW + 60) * 1000)).toBe(true);
  });

  it('reembolso parcial: no cierra el acceso (Stripe deja charge.refunded=false)', () => {
    const s = server();
    s.subscribe();
    s.apply(refunded(NOW, 'ch_a_1', 'pi_a_1', false));
    expect(s.active('a', NOW)).toBe(true);
  });

  it('duplicados: el mismo evento se aplica una vez; otra entrega del reembolso o de la factura no reabre', () => {
    const s = server();
    s.subscribe();
    const r = refunded(NOW, 'ch_a_1', 'pi_a_1');
    expect(s.apply(r)).toBe(true);
    expect(s.apply(r)).toBe(false);
    s.apply(refunded(NOW + 5, 'ch_a_1', 'pi_a_1')); // otro id de evento, mismo cargo
    s.apply(invoicePaid(NOW + 6, 'in_a_1', P1)); // la factura reembolsada reenviada con otro id
    s.apply(invoicePayment(NOW + 7, 'in_a_1', 'pi_a_1'));
    expect(s.active('a', NOW + 10)).toBe(false);
  });

  it('orden inverso: en cualquiera de las 24 llegadas de alta, factura, enlace y reembolso el acceso queda cerrado', () => {
    const base = [sub('customer.subscription.created', T0), invoicePaid(T0, 'in_a_1', P1), invoicePayment(T0, 'in_a_1', 'pi_a_1'), refunded(T0 + DAY, 'ch_a_1', 'pi_a_1')];
    const perms = (a: Ev[]): Ev[][] => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
    const orders = perms(base);
    expect(orders).toHaveLength(24);
    for (const order of orders) {
      const s = server();
      s.all(order);
      expect(s.active('a', NOW), order.map((e) => e.type).join(' → ')).toBe(false);
    }
    // Sin el reembolso, las 6 llegadas de los otros tres eventos abren el acceso.
    for (const order of perms(base.slice(0, 3))) {
      const s = server();
      s.all(order);
      expect(s.active('a', NOW)).toBe(true);
    }
  });

  it('renovación posterior: tras reembolsar el periodo 1, la factura pagada del periodo 2 vuelve a abrir hasta P2', () => {
    const s = server();
    s.subscribe();
    s.apply(refunded(NOW, 'ch_a_1', 'pi_a_1'));
    expect(s.active('a', NOW)).toBe(false);
    s.apply(sub('customer.subscription.updated', P1 + 10, { start: P1, end: P2 }));
    s.apply(invoicePaid(P1 + 11, 'in_a_2', P2));
    s.apply(invoicePayment(P1 + 12, 'in_a_2', 'pi_a_2'));
    expect(s.status('a', P1 + 20)).toMatchObject({ active: true, until: new Date(P2 * 1000).toISOString() });
  });

  it('reembolso de un periodo antiguo: conserva el periodo pagado posterior', () => {
    const s = server();
    s.subscribe();
    s.all([sub('customer.subscription.updated', P1 + 10, { start: P1, end: P2 }), invoicePaid(P1 + 11, 'in_a_2', P2), invoicePayment(P1 + 12, 'in_a_2', 'pi_a_2')]);
    s.apply(refunded(P1 + 100, 'ch_a_1', 'pi_a_1')); // reembolsa el periodo 1
    expect(s.status('a', P1 + 200)).toMatchObject({ active: true, until: new Date(P2 * 1000).toISOString() });
    s.apply(refunded(P1 + 300, 'ch_a_2', 'pi_a_2')); // y ahora el periodo vigente
    expect(s.active('a', P1 + 400)).toBe(false);
  });

  it('otras cuentas y otros productos: el reembolso de A no toca a B; un cargo de Academy no cambia nada', () => {
    const s = server();
    s.subscribe('a');
    s.subscribe('b');
    // Enlace y reembolso de una factura de otro producto de la misma cuenta de Stripe (sin fila del curso).
    s.apply(invoicePayment(NOW, 'in_academy_9', 'pi_academy_9'));
    s.apply(refunded(NOW, 'ch_academy_9', 'pi_academy_9'));
    expect(s.active('a', NOW)).toBe(true);
    expect(s.active('b', NOW)).toBe(true);
    s.apply(refunded(NOW + 1, 'ch_a_1', 'pi_a_1'));
    expect(s.active('a', NOW + 2)).toBe(false);
    expect(s.active('b', NOW + 2)).toBe(true);
    expect(s.row('b')?.paid_until).toBe(new Date(P1 * 1000).toISOString());
  });

  it('otra suscripción del mismo alumno: reembolsar la anterior no cierra la nueva', () => {
    const s = server();
    s.subscribe();
    s.apply(sub('customer.subscription.deleted', T0 + DAY, { status: 'canceled' }));
    s.all([sub('customer.subscription.created', T0 + 2 * DAY, { id: 'sub_a_new', end: P2 }), invoicePaid(T0 + 2 * DAY, 'in_a_new', P2, { sub: 'sub_a_new' }), invoicePayment(T0 + 2 * DAY, 'in_a_new', 'pi_a_new')]);
    s.apply(refunded(T0 + 3 * DAY, 'ch_a_1', 'pi_a_1'));
    expect(s.status('a', T0 + 4 * DAY)).toMatchObject({ active: true, until: new Date(P2 * 1000).toISOString() });
  });
});

describe('Vida Diaria · disputas, alertas de fraude y renovación fallida', () => {
  it('disputa abierta o perdida cierra; ganada reabre; una consulta (warning_*) no cambia nada', () => {
    const s = server();
    s.subscribe();
    s.apply(dispute('charge.dispute.created', NOW, 'dp_1', 'ch_a_1', 'pi_a_1', 'warning_needs_response'));
    expect(s.active('a', NOW)).toBe(true);
    s.apply(dispute('charge.dispute.updated', NOW + 1, 'dp_1', 'ch_a_1', 'pi_a_1', 'needs_response'));
    expect(s.active('a', NOW + 2)).toBe(false);
    s.apply(dispute('charge.dispute.updated', NOW + 3, 'dp_1', 'ch_a_1', 'pi_a_1', 'under_review'));
    expect(s.active('a', NOW + 4)).toBe(false);
    s.apply(dispute('charge.dispute.closed', NOW + 5, 'dp_1', 'ch_a_1', 'pi_a_1', 'won'));
    expect(s.active('a', NOW + 6)).toBe(true);
    const lost = server();
    lost.subscribe();
    lost.apply(dispute('charge.dispute.created', NOW, 'dp_2', 'ch_a_1', 'pi_a_1', 'needs_response'));
    lost.apply(dispute('charge.dispute.closed', NOW + 5, 'dp_2', 'ch_a_1', 'pi_a_1', 'lost'));
    expect(lost.active('a', NOW + 6)).toBe(false);
  });

  it('disputa en orden inverso: el cierre ganado que llega antes que la apertura no se pisa', () => {
    const s = server();
    s.subscribe();
    expect(s.apply(dispute('charge.dispute.closed', NOW + 5, 'dp_1', 'ch_a_1', 'pi_a_1', 'won'))).toBe(true);
    expect(s.apply(dispute('charge.dispute.created', NOW + 1, 'dp_1', 'ch_a_1', 'pi_a_1', 'needs_response'))).toBe(false);
    expect(s.active('a', NOW + 6)).toBe(true);
  });

  it('alerta temprana de fraude: no mueve dinero por sí sola y no cambia el acceso; el reembolso posterior sí', () => {
    const s = server();
    s.subscribe();
    const efw = ev('radar.early_fraud_warning.created', NOW, { id: 'issfr_1', object: 'radar.early_fraud_warning', actionable: true, charge: 'ch_a_1', payment_intent: 'pi_a_1', fraud_type: 'unauthorized_use_of_card' });
    expect(s.apply(efw)).toBe(true);
    expect(s.active('a', NOW)).toBe(true);
    s.apply(refunded(NOW + 1, 'ch_a_1', 'pi_a_1'));
    expect(s.active('a', NOW + 2)).toBe(false);
  });

  it('renovación fallida: invoice.payment_failed no cambia nada; past_due deja el acceso en el fin del periodo pagado', () => {
    const s = server();
    s.subscribe();
    expect(s.apply(ev('invoice.payment_failed', P1 + 10, { id: 'in_a_2', parent: { subscription_details: { metadata: { user_id: 'a', product: vd.VD_PRODUCT }, subscription: 'sub_a' } } }))).toBe(false);
    s.apply(sub('customer.subscription.updated', P1 + 11, { status: 'past_due', start: P1, end: P2 }));
    expect(s.active('a', P1 - 60)).toBe(true);
    expect(s.active('a', P1 + 60)).toBe(false);
    expect(s.status('a', P1 + 60).status).toBe('past_due');
  });
});

describe('Vida Diaria · disputas en el mismo segundo: el cierre terminal precede a la apertura (#issuecomment-6728269789)', () => {
  const opened = (t: number, id = 'dp_s') => dispute('charge.dispute.created', t, id, 'ch_a_1', 'pi_a_1', 'needs_response');
  const updated = (t: number, status: string, id = 'dp_s') => dispute('charge.dispute.updated', t, id, 'ch_a_1', 'pi_a_1', status);
  const closed = (t: number, status: 'won' | 'lost', id = 'dp_s') => dispute('charge.dispute.closed', t, id, 'ch_a_1', 'pi_a_1', status);
  const run = (events: Ev[]) => { const s = server(); s.subscribe(); s.all(events); return s.module('a', '02-compras', NOW + 10); };

  it('won con el mismo event.created: abierto en los dos órdenes de llegada', () => {
    expect(run([opened(NOW), closed(NOW, 'won')])).toBe('granted');
    expect(run([closed(NOW, 'won'), opened(NOW)])).toBe('granted'); // la regresión reproducida
    expect(run([closed(NOW, 'won'), updated(NOW, 'under_review'), opened(NOW)])).toBe('granted');
  });

  it('lost con el mismo event.created: cerrado en los dos órdenes de llegada', () => {
    expect(run([opened(NOW), closed(NOW, 'lost')])).toBe('payment_required');
    expect(run([closed(NOW, 'lost'), opened(NOW)])).toBe('payment_required');
  });

  it('segundos distintos: manda la cronología en cualquier orden de llegada; el ID del evento no se usa como reloj', () => {
    const chain = [opened(NOW), updated(NOW + 1, 'under_review'), closed(NOW + 2, 'won')];
    expect(run(chain)).toBe('granted');
    expect(run([...chain].reverse())).toBe('granted');
    expect(run([chain[2], chain[0], chain[1]])).toBe('granted');
    const lost = [opened(NOW), closed(NOW + 2, 'lost')];
    expect(run([...lost].reverse())).toBe('payment_required');
    // Un estado no terminal de un segundo POSTERIOR sí se aplica (cronología, no tipo de evento).
    expect(run([closed(NOW, 'won'), updated(NOW + 1, 'needs_response')])).toBe('payment_required');
    // IDs de evento en orden opuesto a la cronología: el resultado no cambia.
    const a = { ...closed(NOW, 'won'), id: 'evt_000_closed' };
    const b = { ...opened(NOW), id: 'evt_zzz_opened' };
    expect(run([b, a])).toBe('granted');
    expect(run([a, b])).toBe('granted');
  });

  it('duplicados: el mismo cierre o la misma apertura reenviados se aplican una vez', () => {
    const s = server();
    s.subscribe();
    const c = closed(NOW, 'won');
    const o = opened(NOW);
    expect(s.apply(c)).toBe(true);
    expect(s.apply(o)).toBe(false);
    expect(s.apply(c)).toBe(false);
    expect(s.apply(o)).toBe(false);
    expect(s.module('a', '02-compras', NOW + 10)).toBe('granted');
  });

  it('el reembolso y la renovación siguen igual con la precedencia nueva', () => {
    const s = server();
    s.subscribe();
    s.all([closed(NOW, 'won'), opened(NOW)]);
    s.apply(refunded(NOW, 'ch_a_1', 'pi_a_1'));
    expect(s.module('a', '02-compras', NOW + 10)).toBe('payment_required');
    s.all([sub('customer.subscription.updated', P1 + 10, { start: P1, end: P2 }), invoicePaid(P1 + 11, 'in_a_2', P2), invoicePayment(P1 + 12, 'in_a_2', 'pi_a_2')]);
    expect(s.status('a', P1 + 20)).toMatchObject({ active: true, until: new Date(P2 * 1000).toISOString() });
  });
});
