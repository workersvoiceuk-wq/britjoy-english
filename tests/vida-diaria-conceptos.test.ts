// «Inglés para el día a día» · comprobación de factura y conceptos con IVA incluido (curso £12, orientación £8).
// Datos sintéticos, sin red. Control negativo: con el contrato de 0aaeadb (sin vdPrices ni la comprobación) las
// facturas insuficientes abren el curso y estas pruebas fallan.
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import * as vd from '../supabase/functions/_shared/vida-diaria';
import type { CourseAccessRow } from '../supabase/functions/_shared/vida-diaria';

const P12 = 'price_test_vd_curso_12', P8 = 'price_test_vd_orientacion_8', ACADEMY = 'price_test_academy';
const mod = vd as unknown as Record<string, (...a: unknown[]) => unknown>;
const prices = (mod.vdPrices ? mod.vdPrices(P12, P8) : vd.vdPriceIds(P12)) as vd.VdPrices;
const DAY = 86_400, T0 = 1_794_000_000, P1 = T0 + 30 * DAY, P2 = P1 + 30 * DAY, NOW = T0 + DAY;

let n = 0;
type Ev = { id: string; type: string; created: number; data: { object: unknown } };
const ev = (type: string, created: number, object: unknown): Ev => ({ id: `evt_c_${++n}`, type, created, data: { object } });
const line = (price: string, amount: number, end: number, extra: Record<string, unknown> = {}) =>
  ({ amount, currency: 'gbp', quantity: 1, period: { start: end - 30 * DAY, end }, pricing: { price_details: { price } }, ...extra });
function invoice(created: number, id: string, lines: unknown[], over: Record<string, unknown> = {}) {
  const total = (lines as Array<{ amount: number }>).reduce((s, l) => s + l.amount, 0);
  return ev('invoice.paid', created, {
    id, status: 'paid', currency: 'gbp', total, amount_paid: total,
    parent: { subscription_details: { metadata: { user_id: 'a', product: vd.VD_PRODUCT }, subscription: 'sub_a' } },
    lines: { data: lines, has_more: false }, ...over,
  });
}
const sub = (type: string, created: number, items: string[], o: { start?: number; end?: number; status?: string } = {}) => ev(type, created, {
  id: 'sub_a', status: o.status ?? 'active', customer: 'cus_a', cancel_at_period_end: false, cancel_at: null,
  metadata: { user_id: 'a', product: vd.VD_PRODUCT },
  items: { data: items.map((price) => ({ price: { id: price }, current_period_start: o.start ?? T0, current_period_end: o.end ?? P1 })) },
});
const link = (created: number, inv: string, pi: string) => ev('invoice_payment.paid', created, { id: `inpay_${inv}`, invoice: inv, status: 'paid', payment: { type: 'payment_intent', payment_intent: pi } });

function server() {
  const rows = new Map<string, CourseAccessRow>(), seen = new Set<string>(), book = vd.newPaymentBook();
  const apply = (e: Ev) => vd.applyVidaDiariaEvent(rows, seen, book, e, prices);
  return {
    apply,
    all: (es: Ev[]) => es.forEach(apply),
    status: (at = NOW) => vd.accessStatus(rows.get(`a:${vd.VD_PRODUCT}`), at * 1000) as vd.AccessStatus & { orientation?: { included: boolean; until: string | null } },
    module: (at = NOW) => vd.decideModule('02-compras', rows.get(`a:${vd.VD_PRODUCT}`), at * 1000),
  };
}
/** Subscription to the course only, plus the given invoice. */
const courseWith = (inv: Ev) => { const s = server(); s.all([sub('customer.subscription.created', T0, [P12]), inv]); return s; };

describe('Vida Diaria · comprobación de factura: solo una factura pagada, completa y exacta abre el curso', () => {
  const bad: Array<[string, Ev]> = [
    ['estado open', invoice(T0, 'in_1', [line(P12, 1200, P1)], { status: 'open', amount_paid: 0 })],
    ['moneda EUR', invoice(T0, 'in_1', [line(P12, 1200, P1, { currency: 'eur' })], { currency: 'eur' })],
    ['importe de la línea 1 (factura insuficiente)', invoice(T0, 'in_1', [line(P12, 1, P1)])],
    ['importe de la línea 1199', invoice(T0, 'in_1', [line(P12, 1199, P1)])],
    ['línea del curso con el importe de la orientación (800)', invoice(T0, 'in_1', [line(P12, 800, P1)])],
    ['amount_paid menor que el total', invoice(T0, 'in_1', [line(P12, 1200, P1)], { amount_paid: 600 })],
    ['total distinto de la suma de líneas', invoice(T0, 'in_1', [line(P12, 1200, P1)], { total: 2400, amount_paid: 2400 })],
    ['pagada fuera de banda', invoice(T0, 'in_1', [line(P12, 1200, P1)], { paid_out_of_band: true })],
    ['una línea ajena (Academy) junto a la del curso', invoice(T0, 'in_1', [line(P12, 1200, P1), line(ACADEMY, 599, P1)])],
    ['líneas paginadas (has_more)', invoice(T0, 'in_1', [line(P12, 1200, P1)], { lines: { data: [line(P12, 1200, P1)], has_more: true } })],
    ['cantidad 2', invoice(T0, 'in_1', [line(P12, 2400, P1, { quantity: 2 })])],
    ['periodo de más de 32 días', invoice(T0, 'in_1', [{ ...line(P12, 1200, P1), period: { start: P1 - 60 * DAY, end: P1 } }])],
    ['línea sin importe', invoice(T0, 'in_1', [{ ...line(P12, 1200, P1), amount: undefined }], { total: 1200, amount_paid: 1200 })],
    ['solo un prorrateo del curso (no paga un periodo)', invoice(T0, 'in_1', [line(P12, 600, P1, { proration: true })])],
  ];
  for (const [name, inv] of bad) {
    it(`no abre: ${name}`, () => {
      const s = courseWith(inv);
      expect(s.status().active).toBe(false);
      expect(s.module()).toBe('payment_required');
    });
  }

  it('abre: factura del curso pagada por £12 (formato nuevo y antiguo de Stripe)', () => {
    expect(courseWith(invoice(T0, 'in_1', [line(P12, 1200, P1)])).status()).toMatchObject({ active: true, price: { display: '£12' } });
    const legacy = invoice(T0, 'in_2', [{ amount: 1200, currency: 'gbp', quantity: 1, period: { start: T0, end: P1 }, price: { id: P12 } }]);
    expect(courseWith(legacy).status().active).toBe(true);
  });
});

describe('Vida Diaria · orientación (£8) solo junto al curso y con su periodo pagado', () => {
  it('curso solo: el curso abre y la orientación no está incluida', () => {
    const s = courseWith(invoice(T0, 'in_1', [line(P12, 1200, P1)]));
    expect(s.status().orientation).toEqual({ included: false, until: null });
  });

  it('curso + orientación pagados (£20): ambos incluidos hasta el fin del periodo', () => {
    const s = server();
    s.all([sub('customer.subscription.created', T0, [P12, P8]), invoice(T0, 'in_1', [line(P12, 1200, P1), line(P8, 800, P1)])]);
    expect(s.status()).toMatchObject({ active: true, orientation: { included: true, until: new Date(P1 * 1000).toISOString() } });
  });

  it('orientación en la suscripción sin factura que la pague: no incluida', () => {
    const s = server();
    s.all([sub('customer.subscription.created', T0, [P12, P8]), invoice(T0, 'in_1', [line(P12, 1200, P1)])]);
    expect(s.status()).toMatchObject({ active: true, orientation: { included: false } });
  });

  it('se quita la orientación de la suscripción: deja de estar incluida aunque se pagara; el curso sigue', () => {
    const s = server();
    s.all([sub('customer.subscription.created', T0, [P12, P8]), invoice(T0, 'in_1', [line(P12, 1200, P1), line(P8, 800, P1)])]);
    s.apply(sub('customer.subscription.updated', T0 + 60, [P12]));
    expect(s.status()).toMatchObject({ active: true, orientation: { included: false } });
  });

  it('añadir la orientación a mitad de periodo con prorrateo pagado: incluida; el curso no se alarga', () => {
    const s = courseWith(invoice(T0, 'in_1', [line(P12, 1200, P1)]));
    s.apply(sub('customer.subscription.updated', T0 + 60, [P12, P8]));
    s.apply(invoice(T0 + 61, 'in_up', [{ ...line(P8, 400, P1, { proration: true }), period: { start: T0 + 15 * DAY, end: P1 } }]));
    expect(s.status(T0 + 16 * DAY)).toMatchObject({ active: true, until: new Date(P1 * 1000).toISOString(), orientation: { included: true } });
    // Un prorrateo de más de £8 no cuenta.
    const t = courseWith(invoice(T0, 'in_1', [line(P12, 1200, P1)]));
    t.apply(sub('customer.subscription.updated', T0 + 60, [P12, P8]));
    t.apply(invoice(T0 + 61, 'in_up', [line(P8, 801, P1, { proration: true })]));
    expect(t.status().orientation.included).toBe(false);
  });

  it('renovación de £20: curso y orientación siguen en el periodo nuevo', () => {
    const s = server();
    s.all([sub('customer.subscription.created', T0, [P12, P8]), invoice(T0, 'in_1', [line(P12, 1200, P1), line(P8, 800, P1)])]);
    s.all([sub('customer.subscription.updated', P1 + 10, [P12, P8], { start: P1, end: P2 }), invoice(P1 + 11, 'in_2', [line(P12, 1200, P2), line(P8, 800, P2)])]);
    expect(s.status(P1 + DAY)).toMatchObject({ active: true, orientation: { included: true, until: new Date(P2 * 1000).toISOString() } });
  });

  it('reembolso completo de la factura de £20: se cierran el curso y la orientación de ese periodo', () => {
    const s = server();
    s.all([sub('customer.subscription.created', T0, [P12, P8]), invoice(T0, 'in_1', [line(P12, 1200, P1), line(P8, 800, P1)]), link(T0, 'in_1', 'pi_1')]);
    s.apply(ev('charge.refunded', NOW, { id: 'ch_1', payment_intent: 'pi_1', refunded: true }));
    expect(s.status()).toMatchObject({ active: false, orientation: { included: false } });
  });

  it('duplicados: la misma factura con otro evento no cambia nada', () => {
    const s = server();
    s.all([sub('customer.subscription.created', T0, [P12, P8]), invoice(T0, 'in_1', [line(P12, 1200, P1), line(P8, 800, P1)])]);
    const before = s.status();
    s.apply(invoice(T0 + 5, 'in_1', [line(P12, 1200, P1), line(P8, 800, P1)]));
    expect(s.status()).toEqual(before);
  });

  it('una suscripción solo de orientación no es una suscripción del curso', () => {
    const s = server();
    s.all([sub('customer.subscription.created', T0, [P8]), invoice(T0, 'in_1', [line(P8, 800, P1)])]);
    expect(s.status().active).toBe(false);
  });
});

describe('Vida Diaria · precios verificados y ofertas', () => {
  const base = { id: P12, active: true, type: 'recurring', currency: 'gbp', unit_amount: 1200, tax_behavior: 'inclusive', recurring: { interval: 'month', interval_count: 1, usage_type: 'licensed' } };
  it('verifyConceptPrice: solo el Price exacto del concepto (activo, mensual, GBP, importe con IVA incluido)', () => {
    expect(vd.verifyConceptPrice(base, 'curso', false)).toBeNull();
    expect(vd.verifyConceptPrice({ ...base, unit_amount: 800 }, 'orientacion', true)).toBeNull();
    expect(vd.verifyConceptPrice({ ...base, tax_behavior: 'unspecified' }, 'curso', false)).toBeNull();
    expect(vd.verifyConceptPrice({ ...base, tax_behavior: 'unspecified' }, 'curso', true)).toBe('tax_behavior');
    expect(vd.verifyConceptPrice({ ...base, tax_behavior: 'exclusive' }, 'curso', false)).toBe('tax_behavior');
    expect(vd.verifyConceptPrice({ ...base, unit_amount: 1999 }, 'curso', false)).toBe('amount');
    expect(vd.verifyConceptPrice({ ...base, currency: 'eur' }, 'curso', false)).toBe('currency');
    expect(vd.verifyConceptPrice({ ...base, active: false }, 'curso', false)).toBe('inactive');
    expect(vd.verifyConceptPrice({ ...base, recurring: { interval: 'year' } }, 'curso', false)).toBe('interval');
    expect(vd.verifyConceptPrice({ ...base, recurring: { interval: 'month', interval_count: 2 } }, 'curso', false)).toBe('interval');
    expect(vd.verifyConceptPrice({ ...base, recurring: { interval: 'month', usage_type: 'metered' } }, 'curso', false)).toBe('usage');
  });

  it('ofertas: el curso solo o curso + orientación; sin precio configurado no se vende; un ID en los dos conceptos se ignora', () => {
    expect(vd.offerPriceIds('curso', prices)).toEqual([P12]);
    expect(vd.offerPriceIds('curso_orientacion', prices)).toEqual([P12, P8]);
    expect(vd.offerPriceIds('curso_orientacion', vd.vdPrices(P12, ''))).toBeNull();
    expect([...vd.vdPrices('price_x', 'price_x')]).toEqual([]);
    expect(vd.isVdOffer('orientacion')).toBe(false); // la orientación nunca se vende sola
    expect(vd.orientationOnSale(undefined)).toBe(false);
    expect(vd.checkoutParams({ price: [P12, P8], user: 'u', returnUrl: 'x', automaticTax: false })).toMatchObject({ line_items: [{ price: P12, quantity: 1 }, { price: P8, quantity: 1 }] });
  });

  it('el checkout verifica cada Price en Stripe, deja la orientación en borrador y el webhook lee los dos conceptos', () => {
    const root = path.resolve(__dirname, '..');
    const checkout = fs.readFileSync(path.join(root, 'supabase/functions/billing-checkout/index.ts'), 'utf8');
    const core = fs.readFileSync(path.join(root, 'supabase/functions/_shared/vida-diaria-checkout.ts'), 'utf8');
    expect(checkout).toContain('retrievePrice: (id) => client.prices.retrieve(id)');
    expect(core).toContain('verifyConceptPrice(');
    expect(core).toContain("'offer_draft'");
    expect(core).toContain("orientationOnSale(d.env('VIDA_DIARIA_ORIENTACION'))");
    const webhook = fs.readFileSync(path.join(root, 'supabase/functions/vida-diaria-webhook/index.ts'), 'utf8');
    expect(webhook).toContain('vdPrices(Deno.env.get("STRIPE_PRICE_VIDA_DIARIA"), Deno.env.get("STRIPE_PRICE_VIDA_DIARIA_ORIENTACION"))');
    expect(webhook).toContain('p_orientation_until: paid.orientationUntil');
    expect(webhook).toContain('p_orientation: change.orientation');
  });
});
