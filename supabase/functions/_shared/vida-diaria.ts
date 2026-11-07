// «Inglés para el día a día» (catálogo dia-a-dia, nivel DIA): producto individual, separado de VUM Academy y de
// Life in the UK. Suscripción mensual de £19.99 GBP para altas nuevas. Este módulo es lógica pura (sin Deno, sin red),
// así la comparten el webhook, la función de acceso, las pruebas y el servidor de pruebas de la interfaz.
//
// Reglas del contrato:
// - El acceso solo lo concede el servidor, a partir de eventos de Stripe firmados (customer.subscription.*) cuyo
//   precio es el configurado (STRIPE_PRICE_VIDA_DIARIA) Y cuyo metadata.product es VD_PRODUCT. Otro precio u otro
//   producto (VUM Academy, créditos…) nunca abre este curso, y este curso nunca abre VUM Academy.
// - El acceso pertenece al user_id verificado que creó el checkout (metadata.user_id), nunca a un email ni al cliente.
// - active / trialing / past_due dan acceso hasta el final del periodo pagado; cancelar al final del periodo mantiene
//   el acceso hasta esa fecha; deleted, unpaid, incomplete… lo cierran.
// - Los eventos se aplican una vez (id) y nunca un evento más antiguo encima de uno más nuevo (created).
// - El módulo 1 es la muestra gratuita: no necesita cuenta ni tarjeta y va en el bundle público.

export const VD_PRODUCT = 'vida_diaria_monthly';
export const VD_PRICE = { amount: 1999, currency: 'gbp', interval: 'month', display: '£19.99' } as const;
export const VD_LEVEL_ID = 'DIA';
export const VD_SAMPLE_MODULES = ['01-presentaciones'] as const;
export const VD_MODULES = [
  '01-presentaciones', '02-compras', '03-transporte', '04-vivienda', '05-salud', '06-empleo',
  '07-trabajo', '08-llamadas', '09-colegio', '10-servicios', '11-social', '12-opiniones',
] as const;
export type VdModuleId = (typeof VD_MODULES)[number];

const LIVE = new Set(['active', 'trialing', 'past_due']);

export interface SubscriptionLike {
  id: string;
  status: string;
  customer: string | { id: string };
  cancel_at_period_end?: boolean;
  current_period_end?: number;
  metadata?: Record<string, string> | null;
  items: { data: Array<{ price: { id: string }; current_period_end?: number }> };
}

export interface CourseAccessRow {
  user_id: string;
  product: string;
  status: string;
  /** ISO date until which the learner has access. */
  access_until: string | null;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  /** Stripe `event.created` (seconds) of the last event applied. */
  last_event_created: number;
}

export interface AccessChange {
  event: string;
  eventCreated: number;
  user: string;
  product: typeof VD_PRODUCT;
  status: string;
  accessUntil: string | null;
  cancelAtPeriodEnd: boolean;
  subscription: string;
  customer: string | null;
}

export const isVdModule = (m: unknown): m is VdModuleId => typeof m === 'string' && (VD_MODULES as readonly string[]).includes(m);
export const isSampleModule = (m: string) => (VD_SAMPLE_MODULES as readonly string[]).includes(m);

/** Price IDs (comma-separated) that sell this course; empty means the course is not on sale. */
export function vdPriceIds(raw: string | undefined | null): Set<string> {
  return new Set((raw ?? '').split(',').map((s) => s.trim()).filter(Boolean));
}

export function isVidaDiariaSubscription(sub: SubscriptionLike, prices: Set<string>): boolean {
  return sub.metadata?.product === VD_PRODUCT && prices.size > 0 && sub.items.data.some((i) => prices.has(i.price.id));
}

export function periodEndSeconds(sub: SubscriptionLike): number | null {
  return sub.items.data[0]?.current_period_end ?? sub.current_period_end ?? null;
}

/** What a signed subscription event means for this course, or null when it is not about this course. */
export function accessChangeFromEvent(
  event: { id: string; type: string; created: number; data: { object: unknown } },
  prices: Set<string>,
): AccessChange | null {
  if (!event.type.startsWith('customer.subscription.')) return null;
  const sub = event.data.object as SubscriptionLike;
  if (!isVidaDiariaSubscription(sub, prices)) return null;
  const user = sub.metadata?.user_id;
  if (!user) return null;
  const deleted = event.type === 'customer.subscription.deleted';
  const end = periodEndSeconds(sub);
  const live = !deleted && LIVE.has(sub.status) && end !== null;
  return {
    event: event.id,
    eventCreated: event.created,
    user,
    product: VD_PRODUCT,
    status: deleted ? 'canceled' : sub.status,
    accessUntil: live ? new Date(end! * 1000).toISOString() : null,
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
    subscription: sub.id,
    customer: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? null,
  };
}

/** Checkout sessions of this course grant nothing by themselves (the subscription events do). */
export function isVidaDiariaCheckout(session: { metadata?: Record<string, string> | null }): boolean {
  return session.metadata?.product === VD_PRODUCT;
}

/** Same rule as the SQL function apply_course_access: one application per event, never older over newer. */
export function applyAccessChange(rows: Map<string, CourseAccessRow>, seen: Set<string>, c: AccessChange): boolean {
  if (seen.has(c.event)) return false;
  seen.add(c.event);
  const key = `${c.user}:${c.product}`;
  const prev = rows.get(key);
  if (prev && prev.last_event_created > c.eventCreated) return false;
  rows.set(key, {
    user_id: c.user,
    product: c.product,
    status: c.status,
    access_until: c.accessUntil,
    cancel_at_period_end: c.cancelAtPeriodEnd,
    stripe_subscription_id: c.subscription,
    stripe_customer_id: c.customer ?? prev?.stripe_customer_id ?? null,
    last_event_created: c.eventCreated,
  });
  return true;
}

export function hasCourseAccess(row: Pick<CourseAccessRow, 'status' | 'access_until'> | null | undefined, now = Date.now()): boolean {
  return Boolean(row && LIVE.has(row.status) && row.access_until && Date.parse(row.access_until) > now);
}

export interface AccessStatus {
  product: typeof VD_PRODUCT;
  price: typeof VD_PRICE;
  active: boolean;
  status: string;
  until: string | null;
  cancelAtPeriodEnd: boolean;
  sample: readonly string[];
}

export function accessStatus(row: CourseAccessRow | null | undefined, now = Date.now()): AccessStatus {
  const active = hasCourseAccess(row, now);
  return {
    product: VD_PRODUCT,
    price: VD_PRICE,
    active,
    status: row ? (active ? row.status : row.status === 'canceled' || !row.access_until || Date.parse(row.access_until) <= now ? 'expired' : row.status) : 'none',
    until: active ? row!.access_until : null,
    cancelAtPeriodEnd: Boolean(row?.cancel_at_period_end && active),
    sample: VD_SAMPLE_MODULES,
  };
}

export type ModuleDecision = 'sample' | 'granted' | 'payment_required' | 'unknown_module';

export function decideModule(moduleId: unknown, row: CourseAccessRow | null | undefined, now = Date.now()): ModuleDecision {
  if (!isVdModule(moduleId)) return 'unknown_module';
  if (isSampleModule(moduleId)) return 'sample';
  return hasCourseAccess(row, now) ? 'granted' : 'payment_required';
}

/** New sign-ups only: a learner who already has live access is not sent to a second checkout. */
export function canStartCheckout(row: CourseAccessRow | null | undefined, now = Date.now()): boolean {
  return !hasCourseAccess(row, now);
}

/** Real charges stay off until the owner switches them on after verifying access in test mode. */
export function liveChargesAllowed(secretKey: string | undefined, liveFlag: string | undefined): boolean {
  if (!secretKey) return false;
  if (secretKey.startsWith('sk_test_') || secretKey.startsWith('rk_test_')) return true;
  return liveFlag === 'on';
}
