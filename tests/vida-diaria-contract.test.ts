// «Inglés para el día a día»: contrato de acceso pagado en modo de prueba. Los eventos se firman como Stripe
// (Stripe-Signature: t=…,v1=HMAC-SHA256(secret, `${t}.${payload}`)) y se verifican antes de aplicarlos; el estado
// sale solo de los eventos aplicados, como hace el webhook con apply_course_access.
import { createHmac, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CHECKOUT_REUSE_MARGIN_MS, VD_PRODUCT, accessChangeFromEvent, accessStatus, applyAccessChange, applyPayment, automaticTaxEnabled,
  VD_WEBHOOK_EVENTS, canStartCheckout, checkoutParams, decideModule, isVidaDiariaCheckout, isVidaDiariaEvent, liveChargesAllowed,
  paymentFromEvent, planCheckout,
  vdPriceIds, type CheckoutState, type CourseAccessRow,
} from '../supabase/functions/_shared/vida-diaria';

const SECRET = 'whsec_test_only_not_a_real_secret';
const PRICE = 'price_test_vida_diaria';
const ACADEMY_PRICE = 'price_test_academy';
const prices = vdPriceIds(PRICE);
const DAY = 86_400;
const T0 = 1_794_000_000; // 2026-11-07 aprox.

function sign(payload: string, t: number, secret = SECRET) {
  return `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex')}`;
}
/** Same check as Stripe's constructEvent: v1 HMAC and a 5-minute tolerance. */
function verify(payload: string, header: string, now: number, secret = SECRET) {
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=') as [string, string]));
  const expected = createHmac('sha256', secret).update(`${parts.t}.${payload}`).digest('hex');
  const ok = parts.v1 && parts.v1.length === expected.length && timingSafeEqual(Buffer.from(parts.v1), Buffer.from(expected));
  if (!ok) throw new Error('bad signature');
  if (Math.abs(now - Number(parts.t)) > 300) throw new Error('timestamp outside tolerance');
  return JSON.parse(payload);
}

let n = 0;
/** invoice.paid for the period [start, end] (newest Stripe API shape: parent.subscription_details + pricing). */
function paidEvent(created: number, end: number, opts: Partial<{ user: string; price: string; product: string; legacy: boolean }> = {}) {
  const meta = { user_id: opts.user ?? 'user-a', product: opts.product ?? VD_PRODUCT };
  const line = opts.legacy ? { period: { start: end - 30 * DAY, end }, price: { id: opts.price ?? PRICE } } : { period: { start: end - 30 * DAY, end }, pricing: { price_details: { price: opts.price ?? PRICE } } };
  const object = opts.legacy
    ? { subscription: 'sub_test_1', subscription_details: { metadata: meta }, lines: { data: [line] } }
    : { parent: { subscription_details: { metadata: meta, subscription: 'sub_test_1' } }, lines: { data: [line] } };
  return { id: `evt_test_${++n}`, type: 'invoice.paid', created, data: { object } };
}

function subEvent(type: string, created: number, sub: Partial<{ status: string; user: string; end: number; start: number; cancel: boolean; price: string; product: string; id: string }>) {
  return {
    id: `evt_test_${++n}`,
    type,
    created,
    data: {
      object: {
        id: sub.id ?? 'sub_test_1',
        status: sub.status ?? 'active',
        customer: 'cus_test_1',
        cancel_at_period_end: sub.cancel ?? false,
        metadata: { user_id: sub.user ?? 'user-a', product: sub.product ?? VD_PRODUCT },
        items: { data: [{ price: { id: sub.price ?? PRICE }, current_period_start: sub.start ?? (sub.end ?? T0 + 30 * DAY) - 30 * DAY, current_period_end: sub.end ?? T0 + 30 * DAY }] },
      },
    },
  };
}

/** A tiny server: signed webhook → course_access rows → status / module decisions. */
function server() {
  const rows = new Map<string, CourseAccessRow>();
  const seen = new Set<string>();
  return {
    webhook(event: { id: string; type: string; created: number; data: { object: unknown } }, now: number, header?: string) {
      const payload = JSON.stringify(event);
      const verified = verify(payload, header ?? sign(payload, now), now);
      const payment = paymentFromEvent(verified, prices);
      if (payment) return applyPayment(rows, seen, payment);
      const change = accessChangeFromEvent(verified, prices);
      return change ? applyAccessChange(rows, seen, change) : false;
    },
    /** A paid subscription: subscription.created + invoice.paid for its first period. */
    subscribe(user: string, now: number, end = now + 30 * DAY) {
      this.webhook(subEvent('customer.subscription.created', now, { user, end }), now);
      this.webhook(paidEvent(now, end, { user }), now);
    },
    row: (user: string) => rows.get(`${user}:${VD_PRODUCT}`) ?? null,
    status: (user: string, now: number) => accessStatus(rows.get(`${user}:${VD_PRODUCT}`), now * 1000),
    module: (user: string, id: string, now: number) => decideModule(id, rows.get(`${user}:${VD_PRODUCT}`), now * 1000),
  };
}

describe('Inglés para el día a día · contrato de acceso (modo de prueba)', () => {
  it('muestra: el módulo 1 está abierto para cualquiera, sin cuenta ni suscripción; el resto pide pago', () => {
    const s = server();
    expect(s.module('nadie', '01-presentaciones', T0)).toBe('sample');
    expect(s.module('nadie', '02-compras', T0)).toBe('payment_required');
    expect(s.module('nadie', '99-falso', T0)).toBe('unknown_module');
    expect(s.status('nadie', T0)).toMatchObject({ active: false, status: 'none', price: { amount: 1999, currency: 'gbp', interval: 'month', display: '£19.99' } });
  });

  it('compra de prueba: el checkout solo no abre nada; la suscripción firmada abre los 12 módulos', () => {
    const s = server();
    expect(isVidaDiariaCheckout({ metadata: { product: VD_PRODUCT, user_id: 'user-a' } })).toBe(true);
    expect(s.module('user-a', '02-compras', T0)).toBe('payment_required');
    expect(s.webhook(subEvent('customer.subscription.created', T0, {}), T0)).toBe(true);
    // Subscription without its paid invoice yet: not open (events can arrive in any order).
    expect(s.status('user-a', T0)).toMatchObject({ active: false, status: 'pending' });
    expect(s.webhook(paidEvent(T0, T0 + 30 * DAY), T0)).toBe(true);
    expect(s.status('user-a', T0)).toMatchObject({ active: true, status: 'active', cancelAtPeriodEnd: false });
    for (const id of ['02-compras', '07-trabajo', '12-opiniones']) expect(s.module('user-a', id, T0)).toBe('granted');
    expect(canStartCheckout(s.row('user-a'), T0 * 1000)).toBe(false); // no hay segunda alta mientras está activa
  });

  it('firma: sin firma válida, con otro secreto o fuera de tiempo no se aplica nada', () => {
    const s = server();
    const ev = subEvent('customer.subscription.created', T0, {});
    const payload = JSON.stringify(ev);
    expect(() => s.webhook(ev, T0, sign(payload, T0, 'whsec_otro'))).toThrow('bad signature');
    expect(() => s.webhook(ev, T0, sign(payload + ' ', T0))).toThrow('bad signature');
    expect(() => s.webhook(ev, T0 + 600, sign(payload, T0))).toThrow('tolerance');
    expect(s.status('user-a', T0).active).toBe(false);
  });

  it('cancelación: al final del periodo mantiene el acceso hasta esa fecha y después se cierra', () => {
    const s = server();
    const end = T0 + 30 * DAY;
    s.subscribe('user-a', T0, end);
    s.webhook(subEvent('customer.subscription.updated', T0 + DAY, { end, cancel: true }), T0 + DAY);
    expect(s.status('user-a', T0 + DAY)).toMatchObject({ active: true, cancelAtPeriodEnd: true });
    expect(s.module('user-a', '05-salud', end - 60)).toBe('granted');
    expect(s.module('user-a', '05-salud', end + 1)).toBe('payment_required');
    s.webhook(subEvent('customer.subscription.deleted', end + 5, { end, status: 'canceled' }), end + 5);
    expect(s.status('user-a', end + 5)).toMatchObject({ active: false, status: 'expired', until: null });
  });

  it('cancelación inmediata (deleted) cierra el acceso aunque quede periodo', () => {
    const s = server();
    s.subscribe('user-a', T0);
    s.webhook(subEvent('customer.subscription.deleted', T0 + DAY, { status: 'canceled' }), T0 + DAY);
    expect(s.module('user-a', '03-transporte', T0 + DAY)).toBe('payment_required');
    expect(canStartCheckout(s.row('user-a'), (T0 + DAY) * 1000)).toBe(true); // puede volver a suscribirse
  });

  it('caducidad: sin renovación el acceso termina al final del periodo; una renovación lo amplía; impago lo cierra', () => {
    const s = server();
    const end = T0 + 30 * DAY;
    s.subscribe('user-a', T0, end);
    expect(s.status('user-a', end + 1)).toMatchObject({ active: false, status: 'expired' });
    // Paid renewal: the new period is open only once its invoice is paid.
    s.webhook(subEvent('customer.subscription.updated', end, { start: end, end: end + 30 * DAY }), end);
    s.webhook(paidEvent(end + 60, end + 30 * DAY), end + 60);
    expect(s.module('user-a', '04-vivienda', end + DAY)).toBe('granted');
    // unpaid closes access
    s.webhook(subEvent('customer.subscription.updated', end + 9 * DAY, { start: end, end: end + 30 * DAY, status: 'unpaid' }), end + 9 * DAY);
    expect(s.module('user-a', '04-vivienda', end + 10 * DAY)).toBe('payment_required');
  });

  it('cuenta distinta: la suscripción de A no abre nada a B', () => {
    const s = server();
    s.subscribe('user-a', T0);
    expect(s.module('user-a', '02-compras', T0)).toBe('granted');
    expect(s.module('user-b', '02-compras', T0)).toBe('payment_required');
    expect(s.status('user-b', T0)).toMatchObject({ active: false, status: 'none' });
  });

  it('separado de VUM Academy y de otros precios: ni Academy abre este curso ni este curso pasa por Academy', () => {
    const s = server();
    expect(s.webhook(subEvent('customer.subscription.created', T0, { price: ACADEMY_PRICE, product: 'vum_academy' }), T0)).toBe(false);
    expect(s.webhook(subEvent('customer.subscription.created', T0, { price: ACADEMY_PRICE }), T0)).toBe(false); // metadata del curso, precio ajeno
    expect(s.webhook(subEvent('customer.subscription.created', T0, { product: 'vum_academy' }), T0)).toBe(false); // precio del curso, metadata ajena
    expect(s.status('user-a', T0).active).toBe(false);
    expect(accessChangeFromEvent({ id: 'e', type: 'checkout.session.completed', created: T0, data: { object: {} } }, prices)).toBeNull();
    expect(vdPriceIds('')).toEqual(new Set()); // sin precio configurado el curso no se vende
    expect(accessChangeFromEvent(subEvent('customer.subscription.created', T0, {}), vdPriceIds(''))).toBeNull();
  });

  it('renovación impagada: el acceso no pasa de la fecha efectivamente pagada', () => {
    const s = server();
    const end = T0 + 30 * DAY;
    s.subscribe('user-a', T0, end);
    // At renewal Stripe moves the period forward before the invoice is paid (status still "active")…
    s.webhook(subEvent('customer.subscription.updated', end, { start: end, end: end + 30 * DAY }), end);
    expect(s.module('user-a', '06-empleo', end - 60)).toBe('granted');
    expect(s.module('user-a', '06-empleo', end + 60)).toBe('payment_required'); // …but access stops at the paid date
    expect(s.status('user-a', end - 60).until).toBe(new Date(end * 1000).toISOString());
    // …and the failed payment (past_due) keeps the end at the start of the unpaid period, not the new period end.
    s.webhook(subEvent('customer.subscription.updated', end + 3600, { start: end, end: end + 30 * DAY, status: 'past_due' }), end + 3600);
    expect(s.row('user-a')!.access_until).toBe(new Date(end * 1000).toISOString());
    expect(s.module('user-a', '06-empleo', end + 2 * DAY)).toBe('payment_required');
    // Paying later reopens it up to the newly paid date.
    s.webhook(paidEvent(end + 3 * DAY, end + 30 * DAY), end + 3 * DAY);
    s.webhook(subEvent('customer.subscription.updated', end + 3 * DAY + 1, { start: end, end: end + 30 * DAY }), end + 3 * DAY + 1);
    expect(s.module('user-a', '06-empleo', end + 4 * DAY)).toBe('granted');
    expect(s.module('user-a', '06-empleo', end + 30 * DAY + 1)).toBe('payment_required');
  });

  it('invoice.paid: formato antiguo y nuevo de Stripe; otro precio o producto no cuenta; nunca retrocede', () => {
    const s = server();
    expect(paymentFromEvent(paidEvent(T0, T0 + 30 * DAY, { legacy: true }), prices)?.paidUntil).toBe(new Date((T0 + 30 * DAY) * 1000).toISOString());
    expect(paymentFromEvent(paidEvent(T0, T0 + 30 * DAY, { price: ACADEMY_PRICE }), prices)).toBeNull();
    expect(paymentFromEvent(paidEvent(T0, T0 + 30 * DAY, { product: 'vum_academy' }), prices)).toBeNull();
    // Payment first, subscription later (any order) → pending, then active.
    s.webhook(paidEvent(T0, T0 + 30 * DAY), T0);
    expect(s.status('user-a', T0).status).toBe('pending');
    s.webhook(subEvent('customer.subscription.created', T0 + 1, {}), T0 + 1);
    expect(s.status('user-a', T0 + 2).active).toBe(true);
    s.webhook(paidEvent(T0 + 5, T0 + 10 * DAY), T0 + 5); // an older period arriving late does not shorten it
    expect(s.row('user-a')!.paid_until).toBe(new Date((T0 + 30 * DAY) * 1000).toISOString());
  });

  it('cada evento se aplica una vez y un evento antiguo no pisa uno nuevo', () => {
    const s = server();
    const created = subEvent('customer.subscription.created', T0, {});
    const deleted = subEvent('customer.subscription.deleted', T0 + 2 * DAY, { status: 'canceled' });
    const lateUpdate = subEvent('customer.subscription.updated', T0 + DAY, {});
    expect(s.webhook(created, T0)).toBe(true);
    expect(s.webhook(created, T0)).toBe(false); // reintento de Stripe
    expect(s.webhook(deleted, T0 + 2 * DAY)).toBe(true);
    expect(s.webhook(lateUpdate, T0 + 2 * DAY)).toBe(false); // llega tarde y es más antiguo
    expect(s.status('user-a', T0 + 2 * DAY).active).toBe(false);
  });

  it('checkout concurrente: una sola sesión por alumno; se reutiliza mientras vale y se recupera al caducar', async () => {
    // Database row with a per-user lock (like begin_course_checkout … for update) and a Stripe double that honours
    // idempotency keys like the real API (same key → same session).
    const rows = new Map<string, CheckoutState>();
    let lock = Promise.resolve();
    const stripe = { created: 0, byKey: new Map<string, { id: string; url: string; expires_at: number }>() };
    let clock = T0 * 1000;
    async function request(user: string) {
      let release!: () => void;
      const prev = lock;
      lock = new Promise((r) => (release = r));
      await prev; // serialised like SELECT … FOR UPDATE
      const state = rows.get(user) ?? null;
      const plan = planCheckout(user, state, clock);
      if (plan.action === 'create') rows.set(user, state && state.attempt === plan.attempt ? state : { attempt: plan.attempt, session_id: null, url: null, expires_at: null });
      release();
      if (plan.action === 'reuse') return plan.url;
      await new Promise((r) => setTimeout(r, Math.random() * 5)); // Stripe latency, requests overlap here
      let session = stripe.byKey.get(plan.idempotencyKey);
      if (!session) {
        stripe.created++;
        session = { id: `cs_test_${stripe.created}`, url: `https://checkout.stripe.test/${stripe.created}`, expires_at: Math.floor(clock / 1000) + 3600 };
        stripe.byKey.set(plan.idempotencyKey, session);
      }
      const row = rows.get(user)!;
      if (row.attempt === plan.attempt) rows.set(user, { ...row, session_id: session.id, url: session.url, expires_at: new Date(session.expires_at * 1000).toISOString() });
      return session.url;
    }
    const urls = await Promise.all(Array.from({ length: 6 }, () => request('user-a')));
    expect(new Set(urls).size).toBe(1);
    expect(stripe.created).toBe(1);
    expect(await request('user-a')).toBe(urls[0]); // reused while open
    expect(await request('user-b')).not.toBe(urls[0]); // another account gets its own
    expect(stripe.created).toBe(2);
    clock += 3600_000 - CHECKOUT_REUSE_MARGIN_MS + 1000; // about to expire → recover with a new attempt
    const after = await Promise.all([request('user-a'), request('user-a'), request('user-a')]);
    expect(new Set(after).size).toBe(1);
    expect(after[0]).not.toBe(urls[0]);
    expect(rows.get('user-a')!.attempt).toBe(2);
    expect(stripe.created).toBe(3);
  });

  it('IVA: automatic_tax solo con VIDA_DIARIA_AUTOMATIC_TAX=on; el resto del checkout no cambia', () => {
    expect(automaticTaxEnabled(undefined)).toBe(false);
    expect(automaticTaxEnabled('true')).toBe(false);
    expect(automaticTaxEnabled('on')).toBe(true);
    const base = { price: PRICE, user: 'user-a', email: 'a@example.com', returnUrl: 'https://vozunidamundo.com/britjoy-english/vida-diaria/', now: T0 * 1000 };
    const off = checkoutParams({ ...base, automaticTax: false });
    expect(off).not.toHaveProperty('automatic_tax');
    expect(off).toMatchObject({ mode: 'subscription', line_items: [{ price: PRICE, quantity: 1 }], customer_email: 'a@example.com',
      subscription_data: { metadata: { user_id: 'user-a', product: VD_PRODUCT } }, expires_at: T0 + 3600 });
    const on = checkoutParams({ ...base, automaticTax: true });
    expect(on).toMatchObject({ automatic_tax: { enabled: true }, billing_address_collection: 'required' });
    expect(on).not.toHaveProperty('customer_update'); // only for an existing customer
    expect(checkoutParams({ ...base, customer: 'cus_1', automaticTax: true })).toMatchObject({ customer: 'cus_1', customer_update: { address: 'auto', name: 'auto' } });
    // Turning tax on never turns live charges on.
    expect(liveChargesAllowed('sk_live_x', undefined)).toBe(false);
  });

  it('cobros reales apagados salvo clave de prueba o VIDA_DIARIA_LIVE=on', () => {
    expect(liveChargesAllowed(undefined, undefined)).toBe(false);
    expect(liveChargesAllowed('sk_test_x', undefined)).toBe(true);
    expect(liveChargesAllowed('sk_live_x', undefined)).toBe(false);
    expect(liveChargesAllowed('sk_live_x', 'on')).toBe(true);
  });

  it('destino de webhook propio: vida-diaria-webhook con su secreto; billing-webhook ignora el curso y nunca concede Academy', () => {
    const root = path.resolve(__dirname, '..');
    const own = fs.readFileSync(path.join(root, 'supabase/functions/vida-diaria-webhook/index.ts'), 'utf8');
    expect(own).toContain('Deno.env.get("STRIPE_WEBHOOK_SECRET_VIDA_DIARIA")');
    expect(own).toContain('constructEventAsync(');
    expect(own).toContain('db.rpc("apply_course_payment"');
    expect(own).toContain('db.rpc("apply_course_access"');
    const code = own.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n'); // code only, not the comments
    expect(code).not.toMatch(/apply_purchase|plus_until|STRIPE_WEBHOOK_SECRET"/);
    const config = fs.readFileSync(path.join(root, 'supabase/config.toml'), 'utf8');
    expect(config).toMatch(/\[functions\.vida-diaria-webhook\]\nverify_jwt = false/);
    const shared = fs.readFileSync(path.join(root, 'supabase/functions/billing-webhook/index.ts'), 'utf8');
    // The course check comes before the general switch and returns: course events never reach apply_purchase.
    const guard = shared.indexOf('if (isVidaDiariaEvent(event)) return ok();');
    expect(guard).toBeGreaterThan(0);
    expect(guard).toBeLessThan(shared.indexOf('switch (event.type)'));
    expect(shared).not.toMatch(/apply_course_(access|payment)/);
    // The events the destination must send are exactly the ones the code handles.
    expect([...VD_WEBHOOK_EVENTS]).toEqual(['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted', 'invoice.paid']);
    for (const type of VD_WEBHOOK_EVENTS) {
      const ev = type === 'invoice.paid' ? paidEvent(T0, T0 + 30 * DAY) : subEvent(type, T0, {});
      expect(isVidaDiariaEvent(ev)).toBe(true);
      expect(Boolean(paymentFromEvent(ev, prices) ?? accessChangeFromEvent(ev, prices))).toBe(true);
    }
    expect(isVidaDiariaEvent(paidEvent(T0, T0 + DAY, { legacy: true }))).toBe(true);
    expect(isVidaDiariaEvent({ type: 'checkout.session.completed', data: { object: { metadata: { product: VD_PRODUCT } } } })).toBe(true);
    // An Academy subscription is not a course event: billing-webhook keeps handling it as before.
    expect(isVidaDiariaEvent(subEvent('customer.subscription.updated', T0, { product: 'vum_academy', price: ACADEMY_PRICE }))).toBe(false);
  });

  it('el checkout del curso no toca el camino de VUM Academy ni de los créditos', () => {
    const root = path.resolve(__dirname, '..');
    const checkout = fs.readFileSync(path.join(root, 'supabase/functions/billing-checkout/index.ts'), 'utf8');
    expect(checkout).toContain('liveChargesAllowed(');
    expect(checkout).toContain('db.rpc("begin_course_checkout"');
    expect(checkout).toContain('idempotencyKey: checkoutIdempotencyKey(user.id, step.attempt)');
    expect(checkout).toContain('automaticTaxEnabled(Deno.env.get("VIDA_DIARIA_AUTOMATIC_TAX"))');
    const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20261107120000_vida_diaria_access.sql'), 'utf8');
    expect(sql).not.toMatch(/plus_until\s*=/);
    expect(sql).not.toMatch(/alter table public\.(profiles|purchases)/);
  });
});
