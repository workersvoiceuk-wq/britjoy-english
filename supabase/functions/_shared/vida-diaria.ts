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
// - El acceso nunca pasa de la fecha EFECTIVAMENTE pagada: paid_until solo avanza con invoice.paid firmados, y una
//   renovación impagada (past_due) se queda en el inicio del periodo no pagado.
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
  cancel_at?: number | null;
  current_period_end?: number;
  current_period_start?: number;
  metadata?: Record<string, string> | null;
  items: { data: Array<{ price: { id: string }; current_period_end?: number; current_period_start?: number }> };
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
  /** ISO end of the last period actually paid (invoice.paid); access never goes past it. */
  paid_until: string | null;
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

export function periodStartSeconds(sub: SubscriptionLike): number | null {
  return sub.items.data[0]?.current_period_start ?? sub.current_period_start ?? null;
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
  // An unpaid renewal (past_due) keeps access only up to the start of the unpaid period, i.e. the date paid for.
  const periodEnd = sub.status === 'past_due' ? periodStartSeconds(sub) : periodEndSeconds(sub);
  const end = periodEnd !== null && sub.cancel_at != null ? Math.min(periodEnd, sub.cancel_at) : periodEnd;
  const live = !deleted && LIVE.has(sub.status) && end !== null;
  return {
    event: event.id,
    eventCreated: event.created,
    user,
    product: VD_PRODUCT,
    status: deleted ? 'canceled' : sub.status,
    accessUntil: live ? new Date(end! * 1000).toISOString() : null,
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end || sub.cancel_at != null),
    subscription: sub.id,
    customer: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? null,
  };
}

/**
 * Any Stripe event about this course (subscription, invoice or checkout), whatever its price. They belong to the
 * course's own webhook destination (vida-diaria-webhook); billing-webhook (VUM Academy, credits) ignores them.
 */
export function isVidaDiariaEvent(event: { type: string; data: { object: unknown } }): boolean {
  const o = event.data.object as {
    metadata?: Record<string, string> | null;
    subscription_details?: { metadata?: Record<string, string> | null } | null;
    parent?: { subscription_details?: { metadata?: Record<string, string> | null } | null } | null;
  };
  return [o?.metadata, o?.subscription_details?.metadata, o?.parent?.subscription_details?.metadata].some((m) => m?.product === VD_PRODUCT);
}

/** Events the course's webhook destination must send (exactly what vida-diaria-webhook uses). */
export const VD_WEBHOOK_EVENTS = ['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted', 'invoice.paid'] as const;

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
    paid_until: prev?.paid_until ?? null,
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

export interface PaymentChange { event: string; user: string; product: typeof VD_PRODUCT; paidUntil: string; subscription: string | null }

interface InvoiceLike {
  subscription?: string | { id: string } | null;
  subscription_details?: { metadata?: Record<string, string> | null } | null;
  parent?: { subscription_details?: { metadata?: Record<string, string> | null; subscription?: string } | null } | null;
  lines?: { data: Array<{ period?: { end?: number }; price?: { id: string } | null; pricing?: { price_details?: { price?: string } } | null }> };
}

/** invoice.paid of this course → the end of the period actually paid. Older/newer Stripe API shapes are both read. */
export function paymentFromEvent(event: { id: string; type: string; data: { object: unknown } }, prices: Set<string>): PaymentChange | null {
  if (event.type !== 'invoice.paid' || prices.size === 0) return null;
  const inv = event.data.object as InvoiceLike;
  const meta = inv.parent?.subscription_details?.metadata ?? inv.subscription_details?.metadata ?? null;
  if (meta?.product !== VD_PRODUCT || !meta.user_id) return null;
  const lines = (inv.lines?.data ?? []).filter((l) => prices.has(l.price?.id ?? l.pricing?.price_details?.price ?? ''));
  const end = Math.max(0, ...lines.map((l) => l.period?.end ?? 0));
  if (!end) return null;
  const sub = inv.parent?.subscription_details?.subscription ?? (typeof inv.subscription === 'string' ? inv.subscription : inv.subscription?.id ?? null);
  return { event: event.id, user: meta.user_id, product: VD_PRODUCT, paidUntil: new Date(end * 1000).toISOString(), subscription: sub };
}

/** Same rule as apply_course_payment: once per event; paid_until only moves forward. */
export function applyPayment(rows: Map<string, CourseAccessRow>, seen: Set<string>, p: PaymentChange): boolean {
  if (seen.has(p.event)) return false;
  seen.add(p.event);
  const key = `${p.user}:${p.product}`;
  const prev = rows.get(key);
  const paid = prev?.paid_until && Date.parse(prev.paid_until) > Date.parse(p.paidUntil) ? prev.paid_until : p.paidUntil;
  rows.set(key, prev ? { ...prev, paid_until: paid } : {
    user_id: p.user, product: p.product, status: 'incomplete', access_until: null, cancel_at_period_end: false,
    stripe_subscription_id: p.subscription, stripe_customer_id: null, last_event_created: 0, paid_until: paid,
  });
  return true;
}

/** Access ends at the earlier of the subscription period and the date actually paid. */
export function effectiveUntil(row: Pick<CourseAccessRow, 'access_until' | 'paid_until'> | null | undefined): number | null {
  if (!row?.access_until || !row.paid_until) return null;
  return Math.min(Date.parse(row.access_until), Date.parse(row.paid_until));
}

export function hasCourseAccess(row: Pick<CourseAccessRow, 'status' | 'access_until' | 'paid_until'> | null | undefined, now = Date.now()): boolean {
  const until = effectiveUntil(row);
  return Boolean(row && LIVE.has(row.status) && until !== null && until > now);
}

/** A first payment or subscription event arrived and the other one has not yet (events can come in any order). */
function pendingActivation(row: CourseAccessRow, now: number): boolean {
  const paidFuture = row.paid_until !== null && Date.parse(row.paid_until) > now;
  const subFuture = LIVE.has(row.status) && row.access_until !== null && Date.parse(row.access_until) > now;
  return (paidFuture && !row.access_until && row.status !== 'canceled') || (subFuture && !row.paid_until);
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
    // An overdue learner can manage the same subscription even after paid access expires.
    status: !row ? 'none' : active || row.status === 'past_due' ? row.status : pendingActivation(row, now) ? 'pending' : 'expired',
    until: active ? new Date(effectiveUntil(row)!).toISOString() : null,
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

/** Payment retries for an existing subscription belong in the portal. */
export function canStartCheckout(row: CourseAccessRow | null | undefined, now = Date.now()): boolean {
  return !row || (row.status !== 'past_due' && !hasCourseAccess(row, now) && !pendingActivation(row, now));
}

/** Real charges stay off until the owner switches them on after verifying access in test mode. */
export function liveChargesAllowed(secretKey: string | undefined, liveFlag: string | undefined): boolean {
  if (!secretKey) return false;
  if (secretKey.startsWith('sk_test_') || secretKey.startsWith('rk_test_')) return true;
  return liveFlag === 'on';
}

// ── Checkout ──────────────────────────────────────────────────────────────────────────────────────────────────────
// One open Checkout Session per learner. The server keeps (attempt, session, url, expires_at) per user in
// course_checkout and creates sessions with a STABLE Stripe idempotency key per user and attempt, so simultaneous
// requests get the same session. A new attempt (new key, new session) starts only once the recorded session has expired.

export interface CheckoutState { attempt: number; session_id: string | null; url: string | null; expires_at: string | null }
export type CheckoutPlan = { action: 'reuse'; url: string } | { action: 'create'; attempt: number; idempotencyKey: string };

export function checkoutIdempotencyKey(user: string, attempt: number): string {
  return `vida-diaria-checkout:${user}:${attempt}`;
}

/** Decision taken while holding the per-user lock (SQL begin_course_checkout does the same). */
export function planCheckout(user: string, state: CheckoutState | null, now = Date.now()): CheckoutPlan {
  if (!state) return { action: 'create', attempt: 1, idempotencyKey: checkoutIdempotencyKey(user, 1) };
  const exp = state.expires_at ? Date.parse(state.expires_at) : null;
  if (state.url && exp !== null && exp > now) return { action: 'reuse', url: state.url };
  // No session recorded yet for this attempt (another request is creating it): same attempt, same key, same session.
  if (!state.session_id) return { action: 'create', attempt: state.attempt, idempotencyKey: checkoutIdempotencyKey(user, state.attempt) };
  // Recorded session expired: recover with a new attempt.
  const attempt = state.attempt + 1;
  return { action: 'create', attempt, idempotencyKey: checkoutIdempotencyKey(user, attempt) };
}

/** Stripe Tax: only with VIDA_DIARIA_AUTOMATIC_TAX=on, once the owner has confirmed the VAT treatment. */
export const automaticTaxEnabled = (flag: string | undefined) => flag === 'on';

export function checkoutParams(a: {
  price: string; user: string; email?: string | null; customer?: string | null; returnUrl: string; automaticTax: boolean;
}): Record<string, unknown> {
  return {
    mode: 'subscription',
    integration_identifier: 'vum-vida-diaria-wnkcfbtr',
    line_items: [{ price: a.price, quantity: 1 }],
    client_reference_id: a.user,
    metadata: { user_id: a.user, product: VD_PRODUCT },
    // Access comes from the subscription events: their metadata names the account and the product.
    subscription_data: { metadata: { user_id: a.user, product: VD_PRODUCT } },
    ...(a.customer ? { customer: a.customer } : { customer_email: a.email ?? undefined }),
    // Stripe sets the expiry so retries with the same idempotency key send the same parameters.
    ...(a.automaticTax
      ? { automatic_tax: { enabled: true }, billing_address_collection: 'required', ...(a.customer ? { customer_update: { address: 'auto', name: 'auto' } } : {}) }
      : {}),
    success_url: `${a.returnUrl}?pago=ok`,
    cancel_url: `${a.returnUrl}?pago=cancelado`,
  };
}
