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
// - El acceso nunca pasa de la fecha EFECTIVAMENTE pagada para esa suscripción: paid_until solo avanza con su invoice.paid, y una
//   renovación impagada (past_due) se queda en el inicio del periodo no pagado.
// - Los eventos se aplican una vez (id) y nunca un evento más antiguo encima de uno más nuevo (created).
// - Reembolso completo o disputa abierta/perdida: la factura de ESE pago deja de contar para paid_until. Se enlaza
//   factura → pago (invoice_payment.paid) → cargo/PaymentIntent (charge.refunded, charge.dispute.*), así que solo
//   cae el periodo de esa factura, de esa suscripción y de esa cuenta; otros periodos pagados siguen contando.
// - El módulo 1 es la muestra gratuita: no necesita cuenta ni tarjeta y va en el bundle público.
// - Conceptos (Reino Unido, IVA incluido): curso £12/mes (STRIPE_PRICE_VIDA_DIARIA) y orientación básica escrita £8/mes
//   (STRIPE_PRICE_VIDA_DIARIA_ORIENTACION), que solo se vende junto al curso (total £20/mes). Una factura cuenta solo si
//   está pagada en GBP, todas sus líneas son de estos conceptos, cada línea vale exactamente su importe (o un prorrateo
//   entre 0 y ese importe) y la suma de líneas es el total cobrado. Si no, no abre nada.

export const VD_PRODUCT = 'vida_diaria_monthly';
export type VdConcept = 'curso' | 'orientacion';
/** Importes confirmados por el dueño (9 nov 2026), IVA incluido. El checkout los contrasta con el Price de Stripe. */
export const VD_CONCEPTS = {
  curso: { amount: 1200, currency: 'gbp', interval: 'month', display: '£12', priceEnv: 'STRIPE_PRICE_VIDA_DIARIA' },
  orientacion: { amount: 800, currency: 'gbp', interval: 'month', display: '£8', priceEnv: 'STRIPE_PRICE_VIDA_DIARIA_ORIENTACION' },
} as const;
/** Ofertas: el curso solo, o el curso con orientación (la orientación nunca se vende sola). */
export const VD_OFFERS = { curso: ['curso'], curso_orientacion: ['curso', 'orientacion'] } as const satisfies Record<string, readonly VdConcept[]>;
export type VdOffer = keyof typeof VD_OFFERS;
export const isVdOffer = (o: unknown): o is VdOffer => typeof o === 'string' && Object.prototype.hasOwnProperty.call(VD_OFFERS, o);
/** Precio que se muestra para el curso (status.price). */
export const VD_PRICE = { amount: VD_CONCEPTS.curso.amount, currency: 'gbp', interval: 'month', display: VD_CONCEPTS.curso.display } as const;
/** Price ID de Stripe → concepto. */
export type VdPrices = ReadonlyMap<string, VdConcept>;
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
  /** The latest paid invoice of this subscription was fully refunded or charged back (not a pending activation). */
  payment_reversed?: boolean;
  /** The current subscription includes the orientation concept. */
  orientation?: boolean;
  /** ISO end of the last orientation period actually paid (not refunded or charged back). */
  orientation_until?: string | null;
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
  orientation: boolean;
}

export const isVdModule = (m: unknown): m is VdModuleId => typeof m === 'string' && (VD_MODULES as readonly string[]).includes(m);
export const isSampleModule = (m: string) => (VD_SAMPLE_MODULES as readonly string[]).includes(m);

const splitIds = (raw: string | undefined | null) => (raw ?? '').split(',').map((s) => s.trim()).filter(Boolean);

/** Course price IDs (comma-separated) → concept map; empty means the course is not on sale. */
export function vdPriceIds(raw: string | undefined | null): VdPrices {
  return new Map(splitIds(raw).map((id) => [id, 'curso' as VdConcept]));
}

/** Course and orientation price IDs → concept map. An ID configured for both concepts is ignored (misconfiguration). */
export function vdPrices(courseRaw: string | undefined | null, orientationRaw?: string | undefined | null): VdPrices {
  const course = splitIds(courseRaw), orientation = splitIds(orientationRaw);
  const both = new Set(course.filter((id) => orientation.includes(id)));
  return new Map([
    ...course.filter((id) => !both.has(id)).map((id) => [id, 'curso' as VdConcept] as const),
    ...orientation.filter((id) => !both.has(id)).map((id) => [id, 'orientacion' as VdConcept] as const),
  ]);
}

/** Every item is a concept of this course, and the course itself is one of them. */
export function isVidaDiariaSubscription(sub: SubscriptionLike, prices: VdPrices): boolean {
  const items = sub.items?.data ?? [];
  return sub.metadata?.product === VD_PRODUCT && prices.size > 0 && items.length > 0
    && items.every((i) => prices.has(i.price.id)) && items.some((i) => prices.get(i.price.id) === 'curso');
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
  prices: VdPrices,
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
    orientation: sub.items.data.some((i) => prices.get(i.price.id) === 'orientacion'),
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
export const VD_WEBHOOK_EVENTS = [
  'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted', 'invoice.paid',
  'invoice_payment.paid', 'charge.refunded', 'charge.dispute.created', 'charge.dispute.updated', 'charge.dispute.closed',
  'radar.early_fraud_warning.created',
] as const;

/** Checkout sessions of this course grant nothing by themselves (the subscription events do). */
export function isVidaDiariaCheckout(session: { metadata?: Record<string, string> | null }): boolean {
  return session.metadata?.product === VD_PRODUCT;
}

// ── Pagos, enlaces y reversiones ─────────────────────────────────────────────────────────────────────────────────
// Libro de pagos del curso (mismo modelo que las tablas course_invoices, course_payment_links y
// course_payment_reversals). Cada factura pagada guarda cuenta, suscripción y fin del periodo; invoice_payment.paid
// enlaza la factura con su PaymentIntent o cargo; charge.refunded y charge.dispute.* marcan ese cargo. paid_until es
// el fin más tardío entre las facturas de la suscripción que NO tienen una reversión activa.

/** paidUntil: end of the full course period this invoice paid (null for an orientation-only proration invoice). */
export interface PaidInvoice { key: string; subscription: string; paidUntil: string | null; orientationUntil: string | null }
export type ReversalKind = 'refund' | 'dispute' | 'fraud_warning';
export interface Reversal { kind: ReversalKind; refs: string[]; active: boolean; created: number; terminal: boolean }
export interface PaymentBook {
  invoices: Map<string, PaidInvoice>;
  /** PaymentIntent or charge id → invoice id. */
  links: Map<string, string>;
  /** refund:<charge> · dispute:<id> · efw:<id> → latest state. */
  reversals: Map<string, Reversal>;
}
export const newPaymentBook = (): PaymentBook => ({ invoices: new Map(), links: new Map(), reversals: new Map() });

function invoiceReversed(book: PaymentBook, invoice: string): boolean {
  for (const r of book.reversals.values()) if (r.active && r.refs.some((ref) => book.links.get(ref) === invoice)) return true;
  return false;
}

const later = (a: string | null, b: string | null) => (!a ? b : !b ? a : Date.parse(b) > Date.parse(a) ? b : a);

/** Latest paid course and orientation periods of (account, subscription) among invoices not refunded or charged back. */
export function paidUntilFor(book: PaymentBook, key: string, subscription: string): { paidUntil: string | null; reversed: boolean; orientationUntil: string | null } {
  let best: string | null = null;
  let orientation: string | null = null;
  let latest: { id: string; until: string } | null = null;
  for (const [id, inv] of book.invoices) {
    if (inv.key !== key || inv.subscription !== subscription) continue;
    if (inv.paidUntil && (!latest || Date.parse(inv.paidUntil) > Date.parse(latest.until))) latest = { id, until: inv.paidUntil };
    if (invoiceReversed(book, id)) continue;
    best = later(best, inv.paidUntil);
    orientation = later(orientation, inv.orientationUntil);
  }
  return { paidUntil: best, reversed: latest !== null && invoiceReversed(book, latest.id), orientationUntil: orientation };
}

function refreshRow(rows: Map<string, CourseAccessRow>, book: PaymentBook, key: string, subscription: string) {
  const row = rows.get(key);
  if (!row || row.stripe_subscription_id !== subscription) return;
  const { paidUntil, reversed, orientationUntil } = paidUntilFor(book, key, subscription);
  rows.set(key, { ...row, paid_until: paidUntil, payment_reversed: reversed, orientation_until: orientationUntil });
}

/** Same rule as the SQL function apply_course_access: one application per event, never older over newer. */
export function applyAccessChange(rows: Map<string, CourseAccessRow>, seen: Set<string>, book: PaymentBook, c: AccessChange): boolean {
  if (seen.has(c.event)) return false;
  seen.add(c.event);
  const key = `${c.user}:${c.product}`;
  const prev = rows.get(key);
  if (prev && prev.last_event_created > c.eventCreated) return false;
  const paid = paidUntilFor(book, key, c.subscription);
  rows.set(key, {
    paid_until: paid.paidUntil,
    payment_reversed: paid.reversed,
    orientation: c.orientation,
    orientation_until: paid.orientationUntil,
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

export interface PaymentChange {
  event: string; invoice: string; user: string; product: typeof VD_PRODUCT; subscription: string;
  /** End of the full course period paid by this invoice; null when it only paid an orientation proration. */
  paidUntil: string | null;
  /** End of the orientation period paid by this invoice, or null. */
  orientationUntil: string | null;
}

interface InvoiceLineLike {
  amount?: number;
  currency?: string;
  quantity?: number | null;
  proration?: boolean;
  parent?: { subscription_item_details?: { proration?: boolean } | null } | null;
  period?: { start?: number; end?: number };
  price?: { id: string } | null;
  pricing?: { price_details?: { price?: string } } | null;
}

interface InvoiceLike {
  id?: string;
  status?: string;
  currency?: string;
  total?: number;
  amount_paid?: number;
  paid_out_of_band?: boolean;
  subscription?: string | { id: string } | null;
  subscription_details?: { metadata?: Record<string, string> | null } | null;
  parent?: { subscription_details?: { metadata?: Record<string, string> | null; subscription?: string } | null } | null;
  lines?: { data: InvoiceLineLike[]; has_more?: boolean };
}

const MAX_PERIOD = 32 * 86_400;
const linePrice = (l: InvoiceLineLike) => l.price?.id ?? l.pricing?.price_details?.price ?? '';

/**
 * invoice.paid of this course → the periods actually paid. Older/newer Stripe API shapes are both read. The invoice
 * counts only when it is paid in full in GBP, every line is a concept of this course with its exact verified amount
 * (a proration line: more than 0 and at most that amount) and the lines add up to the amount paid. Prorations never
 * extend the course period; an orientation proration opens orientation for its own period.
 */
export function paymentFromEvent(event: { id: string; type: string; data: { object: unknown } }, prices: VdPrices): PaymentChange | null {
  if (event.type !== 'invoice.paid' || prices.size === 0) return null;
  const inv = event.data.object as InvoiceLike;
  const meta = inv.parent?.subscription_details?.metadata ?? inv.subscription_details?.metadata ?? null;
  if (meta?.product !== VD_PRODUCT || !meta.user_id) return null;
  if (inv.status !== 'paid' || inv.currency !== 'gbp' || inv.paid_out_of_band === true) return null;
  if (!Number.isSafeInteger(inv.total) || inv.total! <= 0 || inv.amount_paid !== inv.total) return null;
  const lines = inv.lines?.data ?? [];
  if (!lines.length || inv.lines?.has_more) return null;
  let sum = 0, courseEnd = 0, orientationEnd = 0;
  for (const line of lines) {
    const concept = prices.get(linePrice(line));
    if (!concept) return null; // a line that is not this course: the invoice does not count
    if (line.currency !== undefined && line.currency !== 'gbp') return null;
    if (line.quantity != null && line.quantity !== 1) return null;
    const amount = line.amount, expected = VD_CONCEPTS[concept].amount;
    if (!Number.isSafeInteger(amount)) return null;
    const proration = line.proration === true || line.parent?.subscription_item_details?.proration === true;
    if (proration ? !(amount! > 0 && amount! <= expected) : amount !== expected) return null;
    const start = line.period?.start, end = line.period?.end;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || end! <= start! || end! - start! > MAX_PERIOD) return null;
    sum += amount!;
    if (concept === 'curso' && !proration) courseEnd = Math.max(courseEnd, end!);
    if (concept === 'orientacion') orientationEnd = Math.max(orientationEnd, end!);
  }
  if (sum !== inv.total) return null;
  if (!courseEnd && !orientationEnd) return null;
  const sub = inv.parent?.subscription_details?.subscription ?? (typeof inv.subscription === 'string' ? inv.subscription : inv.subscription?.id ?? null);
  if (!sub || !inv.id) return null;
  const iso = (t: number) => (t ? new Date(t * 1000).toISOString() : null);
  return { event: event.id, invoice: inv.id, user: meta.user_id, product: VD_PRODUCT, subscription: sub, paidUntil: iso(courseEnd), orientationUntil: iso(orientationEnd) };
}

/** Same rule as apply_course_payment: once per event, once per invoice, scoped to the invoiced subscription. */
export function applyPayment(rows: Map<string, CourseAccessRow>, seen: Set<string>, book: PaymentBook, p: PaymentChange): boolean {
  if (seen.has(p.event)) return false;
  seen.add(p.event);
  const key = `${p.user}:${p.product}`;
  // A redelivered invoice (another event id, same invoice) keeps its first record.
  if (!book.invoices.has(p.invoice)) book.invoices.set(p.invoice, { key, subscription: p.subscription, paidUntil: p.paidUntil, orientationUntil: p.orientationUntil });
  if (!rows.has(key)) {
    rows.set(key, {
      user_id: p.user, product: p.product, status: 'incomplete', access_until: null, cancel_at_period_end: false,
      stripe_subscription_id: p.subscription, stripe_customer_id: null, last_event_created: 0, paid_until: null,
    });
  }
  refreshRow(rows, book, key, p.subscription);
  return true;
}

export interface LinkChange { event: string; invoice: string; refs: string[] }

/** invoice_payment.paid: which PaymentIntent (or charge) paid which invoice. It carries no account or product. */
export function paymentLinkFromEvent(event: { id: string; type: string; data: { object: unknown } }): LinkChange | null {
  if (event.type !== 'invoice_payment.paid') return null;
  const o = event.data.object as { invoice?: string | { id: string }; status?: string; payment?: { payment_intent?: string | { id: string }; charge?: string | { id: string } } };
  const invoice = typeof o?.invoice === 'string' ? o.invoice : o?.invoice?.id;
  const refs = [o?.payment?.payment_intent, o?.payment?.charge].map((r) => (typeof r === 'string' ? r : r?.id)).filter((r): r is string => Boolean(r));
  if (o?.status !== 'paid' || !invoice || refs.length === 0) return null;
  return { event: event.id, invoice, refs };
}

export interface ReversalChange { event: string; created: number; source: string; kind: ReversalKind; refs: string[]; active: boolean; terminal: boolean }

/** Dispute states in which the funds are withdrawn (chargeback open or lost). Inquiries (warning_*), won and prevented are not. */
export const DISPUTE_REVOKES = new Set(['needs_response', 'under_review', 'lost']);
/** Final dispute states: nothing follows them. Within the same second they win over an opening or an update. */
export const DISPUTE_TERMINAL = new Set(['won', 'lost', 'warning_closed', 'prevented']);
const DISPUTE_EVENTS = new Set(['charge.dispute.created', 'charge.dispute.updated', 'charge.dispute.closed', 'charge.dispute.funds_withdrawn', 'charge.dispute.funds_reinstated']);
const idOf = (r: unknown) => (typeof r === 'string' ? r : (r as { id?: string } | null | undefined)?.id ?? null);

/**
 * charge.refunded → a FULL refund (charge.refunded === true; Stripe leaves it false for partial refunds) reverses that
 * payment. charge.dispute.* → reversed while the chargeback is open or lost; won restores it. An early fraud warning
 * moves no money by itself: it is recorded without changing access (a refund or dispute that follows does).
 */
export function reversalFromEvent(event: { id: string; type: string; created: number; data: { object: unknown } }): ReversalChange | null {
  const o = event.data.object as { id?: string; refunded?: boolean; status?: string; charge?: unknown; payment_intent?: unknown };
  if (!o?.id) return null;
  const base = { event: event.id, created: event.created };
  if (event.type === 'charge.refunded') {
    const refs = [o.id, idOf(o.payment_intent)].filter((r): r is string => Boolean(r));
    return { ...base, source: `refund:${o.id}`, kind: 'refund', refs, active: o.refunded === true, terminal: false };
  }
  const refs = [idOf(o.charge), idOf(o.payment_intent)].filter((r): r is string => Boolean(r));
  if (refs.length === 0) return null;
  if (DISPUTE_EVENTS.has(event.type)) {
    return { ...base, source: `dispute:${o.id}`, kind: 'dispute', refs, active: DISPUTE_REVOKES.has(o.status ?? ''), terminal: DISPUTE_TERMINAL.has(o.status ?? '') };
  }
  if (event.type === 'radar.early_fraud_warning.created' || event.type === 'radar.early_fraud_warning.updated') {
    return { ...base, source: `efw:${o.id}`, kind: 'fraud_warning', refs, active: false, terminal: false };
  }
  return null;
}

function refreshInvoice(rows: Map<string, CourseAccessRow>, book: PaymentBook, invoice: string | undefined) {
  const inv = invoice ? book.invoices.get(invoice) : undefined;
  if (inv) refreshRow(rows, book, inv.key, inv.subscription);
}

/** Same rule as apply_course_payment_link. */
export function applyPaymentLink(rows: Map<string, CourseAccessRow>, seen: Set<string>, book: PaymentBook, l: LinkChange): boolean {
  if (seen.has(l.event)) return false;
  seen.add(l.event);
  for (const ref of l.refs) if (!book.links.has(ref)) book.links.set(ref, l.invoice);
  refreshInvoice(rows, book, l.invoice);
  return true;
}

/**
 * Whether a state of the same refund/dispute must be ignored because the recorded one is newer. Stripe's
 * event.created has 1-second resolution: in the same second a terminal state (won/lost…) is newer than an opening or
 * update. Event ids are not ordered and are never used as a clock.
 */
export function reversalIsOlder(prev: Pick<Reversal, 'created' | 'terminal'>, next: Pick<ReversalChange, 'created' | 'terminal'>): boolean {
  return prev.created > next.created || (prev.created === next.created && prev.terminal && !next.terminal);
}

/** Same rule as apply_course_reversal: once per event, never an older state of the same refund/dispute over a newer one. */
export function applyReversal(rows: Map<string, CourseAccessRow>, seen: Set<string>, book: PaymentBook, r: ReversalChange): boolean {
  if (seen.has(r.event)) return false;
  seen.add(r.event);
  const prev = book.reversals.get(r.source);
  if (prev && reversalIsOlder(prev, r)) return false;
  book.reversals.set(r.source, { kind: r.kind, refs: [...new Set([...(prev?.refs ?? []), ...r.refs])], active: r.active, created: r.created, terminal: r.terminal });
  for (const ref of r.refs) refreshInvoice(rows, book, book.links.get(ref));
  return true;
}

/** One entry point for every event of the course destination (the webhook, the e2e backend and the tests use it). */
export function applyVidaDiariaEvent(
  rows: Map<string, CourseAccessRow>, seen: Set<string>, book: PaymentBook,
  event: { id: string; type: string; created: number; data: { object: unknown } }, prices: VdPrices,
): boolean {
  const payment = paymentFromEvent(event, prices);
  if (payment) return applyPayment(rows, seen, book, payment);
  const link = paymentLinkFromEvent(event);
  if (link) return applyPaymentLink(rows, seen, book, link);
  const reversal = reversalFromEvent(event);
  if (reversal) return applyReversal(rows, seen, book, reversal);
  const change = accessChangeFromEvent(event, prices);
  return change ? applyAccessChange(rows, seen, book, change) : false;
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
  return (paidFuture && !row.access_until && row.status !== 'canceled') || (subFuture && !row.paid_until && !row.payment_reversed);
}

export interface AccessStatus {
  product: typeof VD_PRODUCT;
  price: typeof VD_PRICE;
  active: boolean;
  status: string;
  until: string | null;
  cancelAtPeriodEnd: boolean;
  sample: readonly string[];
  /** Orientación básica escrita: incluida solo si la suscripción la tiene y su periodo está pagado. */
  orientation: { included: boolean; until: string | null };
}

export function orientationStatus(row: CourseAccessRow | null | undefined, now = Date.now()): { included: boolean; until: string | null } {
  if (!row?.orientation || !row.orientation_until || !hasCourseAccess(row, now)) return { included: false, until: null };
  const until = Math.min(Date.parse(row.orientation_until), effectiveUntil(row)!);
  return until > now ? { included: true, until: new Date(until).toISOString() } : { included: false, until: null };
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
    orientation: orientationStatus(row, now),
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
  if (!row) return true;
  // Refunded or charged back while the same subscription is still running: a second checkout would bill twice.
  const stillSubscribed = LIVE.has(row.status) && row.access_until !== null && Date.parse(row.access_until) > now;
  if (row.payment_reversed && stillSubscribed) return false;
  return row.status !== 'past_due' && !hasCourseAccess(row, now) && !pendingActivation(row, now);
}

/** Real charges stay off until the owner switches them on after verifying access in test mode. */
export function liveChargesAllowed(secretKey: string | undefined, liveFlag: string | undefined): boolean {
  if (!secretKey) return false;
  if (secretKey.startsWith('sk_test_') || secretKey.startsWith('rk_test_') || secretKey.startsWith('rkcs_test_')) return true;
  return liveFlag === 'on';
}

// ── Checkout ──────────────────────────────────────────────────────────────────────────────────────────────────────
// One open Checkout Session per learner. The server keeps (attempt, session, url, expires_at) per user in
// course_checkout and creates sessions with a STABLE Stripe idempotency key per user and attempt, so simultaneous
// requests get the same session. A new attempt (new key, new session) starts only once the recorded session has expired.

export interface CheckoutState {
  attempt: number; session_id: string | null; url: string | null; expires_at: string | null;
  /** Offer the recorded (or in-progress) session sells; null for sessions recorded before offers existed. */
  offer?: VdOffer | null;
  /** Last change of the row; a creation of another offer older than 2 minutes no longer blocks (e.g. Stripe failed). */
  updated_at?: string | null;
}

/** Within this margin an unrecorded creation of another offer is treated as in progress; after it, it must be recovered
 * (same rule in SQL). It never lets a different offer create a second payable session. */
export const CHECKOUT_CREATE_GRACE_MS = 2 * 60_000;
export type CheckoutPlan =
  | { action: 'reuse'; url: string }
  | { action: 'create'; attempt: number; idempotencyKey: string }
  /** Another offer holds the learner's only payable session (open, or still being created). */
  | { action: 'conflict'; reason: 'other_offer' | 'in_progress' | 'unrecorded'; offer: VdOffer | null; session: string | null };

/** Stable per (learner, attempt, offer): retries of the same offer get the same session; another offer never does. */
export function checkoutIdempotencyKey(user: string, attempt: number, offer?: VdOffer): string {
  return `vida-diaria-checkout:${user}:${attempt}${offer ? `:${offer}` : ''}`;
}

/** Decision taken while holding the per-user lock (SQL begin_course_checkout does the same). */
export function planCheckout(user: string, state: CheckoutState | null, offer: VdOffer = 'curso', now = Date.now()): CheckoutPlan {
  if (!state) return { action: 'create', attempt: 1, idempotencyKey: checkoutIdempotencyKey(user, 1, offer) };
  const held = state.offer ?? 'curso';
  const exp = state.expires_at ? Date.parse(state.expires_at) : null;
  if (state.url && exp !== null && exp > now) {
    // One payable session per learner: reuse it only for the same offer.
    return held === offer ? { action: 'reuse', url: state.url } : { action: 'conflict', reason: 'other_offer', offer: held, session: state.session_id };
  }
  // No session recorded yet for this attempt (another request is creating it): same offer → same key, same session.
  if (!state.session_id) {
    if (held === offer) return { action: 'create', attempt: state.attempt, idempotencyKey: checkoutIdempotencyKey(user, state.attempt, offer) };
    // Another offer's creation was never recorded (in progress, failed write or late provider): it may exist at Stripe.
    const creating = state.updated_at ? Date.parse(state.updated_at) > now - CHECKOUT_CREATE_GRACE_MS : true;
    return { action: 'conflict', reason: creating ? 'in_progress' : 'unrecorded', offer: held, session: null };
  }
  // Recorded session expired: recover with a new attempt for the requested offer.
  const attempt = state.attempt + 1;
  return { action: 'create', attempt, idempotencyKey: checkoutIdempotencyKey(user, attempt, offer) };
}

/** Stripe Tax: only with VIDA_DIARIA_AUTOMATIC_TAX=on, once the owner has confirmed the VAT treatment. */
export const automaticTaxEnabled = (flag: string | undefined) => flag === 'on';

/** Price IDs to sell for an offer, in order (course first). Null when a concept of the offer is not configured. */
export function offerPriceIds(offer: VdOffer, prices: VdPrices): string[] | null {
  const ids = VD_OFFERS[offer].map((concept) => [...prices].find(([, c]) => c === concept)?.[0]);
  return ids.every(Boolean) ? (ids as string[]) : null;
}

/** Orientation is sold only once the owner has verified it in the test environment (VIDA_DIARIA_ORIENTACION=on). */
export const orientationOnSale = (flag: string | undefined) => flag === 'on';

export interface StripePriceLike {
  id: string; active?: boolean; currency?: string; unit_amount?: number | null; type?: string; tax_behavior?: string | null;
  recurring?: { interval?: string; interval_count?: number; usage_type?: string } | null;
}

/**
 * The Stripe Price must be exactly the confirmed concept: active, recurring every month, GBP and the VAT-inclusive
 * amount. With automatic tax on it must be tax-inclusive, so the learner pays the advertised amount. Returns the
 * reason when it does not match; then no Checkout is created.
 */
export function verifyConceptPrice(price: StripePriceLike, concept: VdConcept, automaticTax: boolean): string | null {
  const c = VD_CONCEPTS[concept];
  if (price.active !== true) return 'inactive';
  if (price.type !== 'recurring' || price.recurring?.interval !== c.interval || (price.recurring?.interval_count ?? 1) !== 1) return 'interval';
  if ((price.recurring?.usage_type ?? 'licensed') !== 'licensed') return 'usage';
  if (price.currency !== c.currency) return 'currency';
  if (price.unit_amount !== c.amount) return 'amount';
  const tax = price.tax_behavior ?? 'unspecified';
  if (tax === 'exclusive' || (automaticTax && tax !== 'inclusive')) return 'tax_behavior';
  return null;
}

export function checkoutParams(a: {
  /** One price ID, or the offer's price IDs (course first). */
  price: string | readonly string[]; user: string; email?: string | null; customer?: string | null; returnUrl: string; automaticTax: boolean;
}): Record<string, unknown> {
  const lines = typeof a.price === 'string' ? [a.price] : a.price;
  return {
    mode: 'subscription',
    integration_identifier: 'vum-vida-diaria-wnkcfbtr',
    line_items: lines.map((price) => ({ price, quantity: 1 })),
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
