// «Inglés para el día a día»: contrato de acceso pagado en modo de prueba. Los eventos se firman como Stripe
// (Stripe-Signature: t=…,v1=HMAC-SHA256(secret, `${t}.${payload}`)) y se verifican antes de aplicarlos; el estado
// sale solo de los eventos aplicados, como hace el webhook con apply_course_access.
import { createHmac, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  VD_PRODUCT, accessChangeFromEvent, accessStatus, applyAccessChange, canStartCheckout, decideModule,
  isVidaDiariaCheckout, liveChargesAllowed, vdPriceIds, type CourseAccessRow,
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
function subEvent(type: string, created: number, sub: Partial<{ status: string; user: string; end: number; cancel: boolean; price: string; product: string; id: string }>) {
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
        items: { data: [{ price: { id: sub.price ?? PRICE }, current_period_end: sub.end ?? T0 + 30 * DAY }] },
      },
    },
  };
}

/** A tiny server: signed webhook → course_access rows → status / module decisions. */
function server() {
  const rows = new Map<string, CourseAccessRow>();
  const seen = new Set<string>();
  return {
    webhook(event: ReturnType<typeof subEvent>, now: number, header?: string) {
      const payload = JSON.stringify(event);
      const verified = verify(payload, header ?? sign(payload, now), now);
      const change = accessChangeFromEvent(verified, prices);
      return change ? applyAccessChange(rows, seen, change) : false;
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
    s.webhook(subEvent('customer.subscription.created', T0, { end }), T0);
    s.webhook(subEvent('customer.subscription.updated', T0 + DAY, { end, cancel: true }), T0 + DAY);
    expect(s.status('user-a', T0 + DAY)).toMatchObject({ active: true, cancelAtPeriodEnd: true });
    expect(s.module('user-a', '05-salud', end - 60)).toBe('granted');
    expect(s.module('user-a', '05-salud', end + 1)).toBe('payment_required');
    s.webhook(subEvent('customer.subscription.deleted', end + 5, { end, status: 'canceled' }), end + 5);
    expect(s.status('user-a', end + 5)).toMatchObject({ active: false, status: 'expired', until: null });
  });

  it('cancelación inmediata (deleted) cierra el acceso aunque quede periodo', () => {
    const s = server();
    s.webhook(subEvent('customer.subscription.created', T0, {}), T0);
    s.webhook(subEvent('customer.subscription.deleted', T0 + DAY, { status: 'canceled' }), T0 + DAY);
    expect(s.module('user-a', '03-transporte', T0 + DAY)).toBe('payment_required');
    expect(canStartCheckout(s.row('user-a'), (T0 + DAY) * 1000)).toBe(true); // puede volver a suscribirse
  });

  it('caducidad: sin renovación el acceso termina al final del periodo; una renovación lo amplía; impago lo cierra', () => {
    const s = server();
    const end = T0 + 30 * DAY;
    s.webhook(subEvent('customer.subscription.created', T0, { end }), T0);
    expect(s.status('user-a', end + 1)).toMatchObject({ active: false, status: 'expired' });
    s.webhook(subEvent('customer.subscription.updated', end - 10, { end: end + 30 * DAY }), end - 10);
    expect(s.module('user-a', '04-vivienda', end + DAY)).toBe('granted');
    // past_due dentro del periodo pagado conserva el acceso; unpaid lo cierra
    s.webhook(subEvent('customer.subscription.updated', end + 2 * DAY, { end: end + 30 * DAY, status: 'past_due' }), end + 2 * DAY);
    expect(s.module('user-a', '04-vivienda', end + 3 * DAY)).toBe('granted');
    s.webhook(subEvent('customer.subscription.updated', end + 9 * DAY, { end: end + 30 * DAY, status: 'unpaid' }), end + 9 * DAY);
    expect(s.module('user-a', '04-vivienda', end + 10 * DAY)).toBe('payment_required');
  });

  it('cuenta distinta: la suscripción de A no abre nada a B', () => {
    const s = server();
    s.webhook(subEvent('customer.subscription.created', T0, { user: 'user-a' }), T0);
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

  it('cobros reales apagados salvo clave de prueba o VIDA_DIARIA_LIVE=on', () => {
    expect(liveChargesAllowed(undefined, undefined)).toBe(false);
    expect(liveChargesAllowed('sk_test_x', undefined)).toBe(true);
    expect(liveChargesAllowed('sk_live_x', undefined)).toBe(false);
    expect(liveChargesAllowed('sk_live_x', 'on')).toBe(true);
  });

  it('el webhook y el checkout del curso no tocan el camino de VUM Academy ni de los créditos', () => {
    const root = path.resolve(__dirname, '..');
    const webhook = fs.readFileSync(path.join(root, 'supabase/functions/billing-webhook/index.ts'), 'utf8');
    // La rama del curso va antes del switch general y termina con return: nunca llega a apply_purchase (plus_until).
    const vd = webhook.indexOf('accessChangeFromEvent(event');
    expect(vd).toBeGreaterThan(0);
    expect(vd).toBeLessThan(webhook.indexOf('switch (event.type)'));
    expect(webhook.slice(vd, webhook.indexOf('switch (event.type)'))).not.toContain('apply_purchase');
    expect(webhook).toContain('if (isVidaDiariaCheckout(s)) break;');
    const checkout = fs.readFileSync(path.join(root, 'supabase/functions/billing-checkout/index.ts'), 'utf8');
    expect(checkout).toContain('subscription_data: { metadata: { user_id: user.id, product: VD_PRODUCT } }');
    expect(checkout).toContain('liveChargesAllowed(');
    const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20261107120000_vida_diaria_access.sql'), 'utf8');
    expect(sql).not.toMatch(/plus_until\s*=/);
    expect(sql).not.toMatch(/alter table public\.(profiles|purchases)/);
  });
});
