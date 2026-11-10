// «Inglés para el día a día» · Checkout de Stripe. Lógica sin Deno ni red: billing-checkout le pasa Stripe, la base de
// datos y la configuración; las pruebas le pasan dobles. Así el handler que se prueba es el mismo que se despliega.
//
// Una sola sesión pagable por alumno, y recuerda su oferta:
// - misma oferta y sesión abierta → la misma URL (reintentos y dobles clics);
// - OTRA oferta con sesión abierta → 409 checkout_open (con la oferta abierta); nunca se devuelve la URL de otra oferta;
// - cambio explícito ({ replace: true }) → se caduca la sesión anterior en Stripe y solo entonces se crea la nueva; si
//   la anterior ya no se puede caducar (se está pagando o se pagó) → 409 checkout_completing;
// - otra oferta mientras otra petición crea la sesión → 409 checkout_in_progress;
// - el registro de la sesión falla, o el proveedor responde tarde: no se entrega la URL y se caduca la sesión; una
//   creación sin registrar se recupera con su clave estable (alumno, intento, oferta) y se registra antes de permitir
//   otra oferta. Si el estado no se puede determinar → 503 retry: nunca dos sesiones pagables.
import {
  VD_PRODUCT, canStartCheckout, checkoutIdempotencyKey, checkoutParams, isVdOffer, liveChargesAllowed, offerPriceIds,
  orientationOnSale, vdPrices, verifyConceptPrice, type CourseAccessRow, type StripePriceLike, type VdOffer,
} from './vida-diaria.ts';

export interface BeginRow {
  action: 'reuse' | 'create' | 'conflict'; attempt: number; url: string | null; offer: VdOffer | null; session_id: string | null;
  /** other_offer: another offer's session is recorded and open · in_progress: another offer is being created right now ·
   *  unrecorded: another offer's creation was never recorded (failed write or late provider): it must be recovered. */
  reason: 'other_offer' | 'in_progress' | 'unrecorded' | null;
}

export interface StripeSessionLike { id: string; url: string | null; expires_at?: number | null; status?: string | null }

export interface VdCheckoutDeps {
  env: (name: string) => string | undefined;
  user: { id: string; email?: string | null };
  returnUrl: string;
  automaticTax: boolean;
  stripe: {
    retrievePrice(id: string): Promise<StripePriceLike>;
    /** Same idempotency key + same parameters → Stripe returns the session it already created (24 h). */
    createSession(params: Record<string, unknown>, idempotencyKey: string): Promise<StripeSessionLike>;
    /** Real current status of a session (a replayed creation returns the original, possibly stale, response). */
    retrieveSession(id: string): Promise<StripeSessionLike>;
    /** Expires an open session; resolves with its final status (also when it was already expired or complete). */
    expireSession(id: string): Promise<{ status: string | null }>;
  };
  db: {
    access(): Promise<{ row: CourseAccessRow | null; error?: unknown }>;
    begin(offer: VdOffer): Promise<{ row: BeginRow | null; error?: unknown }>;
    /** true only when the row now holds this session for this attempt and offer. */
    record(attempt: number, offer: VdOffer, session: { id: string; url: string | null; expires: string | null }): Promise<boolean>;
    /** Marks the learner's open session as finished once Stripe has expired it (only if it is still that session). */
    release(session: string): Promise<void>;
  };
}

export interface VdCheckoutResult { status: number; body: Record<string, unknown> }

const iso = (t: number | null | undefined) => (t ? new Date(t * 1000).toISOString() : null);
/** expires_at recorded for a session Stripe reports as no longer open: any past instant marks it finished. */
const CLOSED = '1970-01-01T00:00:00.000Z';
const retry = (detail: string): VdCheckoutResult => ({ status: 503, body: { error: 'retry', detail } });

export async function vidaDiariaCheckout(body: { offer?: unknown; replace?: unknown }, d: VdCheckoutDeps): Promise<VdCheckoutResult> {
  // Cobros reales apagados hasta que el dueño ponga VIDA_DIARIA_LIVE=on tras verificar el acceso en modo de prueba.
  if (!liveChargesAllowed(d.env('STRIPE_SECRET_KEY'), d.env('VIDA_DIARIA_LIVE'))) return { status: 503, body: { error: 'live_disabled' } };
  const offer = body.offer === undefined ? 'curso' : isVdOffer(body.offer) ? body.offer : null;
  if (!offer) return { status: 400, body: { error: 'invalid_offer' } };
  if (offer === 'curso_orientacion' && !orientationOnSale(d.env('VIDA_DIARIA_ORIENTACION'))) return { status: 409, body: { error: 'offer_draft' } };
  const prices = vdPrices(d.env('STRIPE_PRICE_VIDA_DIARIA'), d.env('STRIPE_PRICE_VIDA_DIARIA_ORIENTACION'));
  const price = offerPriceIds(offer, prices);
  if (!price) return { status: 503, body: { error: 'not_configured' } };
  for (const id of price) {
    const mismatch = verifyConceptPrice(await d.stripe.retrievePrice(id), prices.get(id)!, d.automaticTax);
    if (mismatch) return { status: 503, body: { error: 'price_mismatch', detail: mismatch } };
  }
  const access = await d.db.access();
  if (access.error) return retry('access');
  if (!canStartCheckout(access.row)) return { status: 409, body: { error: 'already_active' } };

  /** Checkout parameters for an offer; the same inputs give the same parameters, so a replay hits Stripe's idempotency. */
  const paramsFor = (o: VdOffer) => {
    const ids = offerPriceIds(o, prices);
    if (!ids) return null;
    const params = checkoutParams({ price: ids, user: d.user.id, email: d.user.email, customer: access.row?.stripe_customer_id ?? null, returnUrl: d.returnUrl, automaticTax: d.automaticTax });
    return { ...params, metadata: { ...(params.metadata as object), offer: o } };
  };
  /**
   * Creates (or, with the same stable key, recovers) the session of (attempt, offer), reads its REAL status and records
   * it. Returns the open session only when the row holds it; anything else closes the step (no URL, no other session).
   */
  const settle = async (attempt: number, o: VdOffer): Promise<{ kind: 'open'; session: StripeSessionLike } | { kind: 'closed' } | { kind: 'paid' } | { kind: 'unknown'; detail: string }> => {
    const params = paramsFor(o);
    if (!params) return { kind: 'unknown', detail: 'offer_not_configured' };
    let session: StripeSessionLike;
    try {
      const created = await d.stripe.createSession(params, checkoutIdempotencyKey(d.user.id, attempt, o));
      session = { ...created, ...(await d.stripe.retrieveSession(created.id)) };
    } catch {
      return { kind: 'unknown', detail: 'provider' };
    }
    if (session.status === 'complete') return { kind: 'paid' };
    const open = session.status === 'open';
    const recorded = await d.db.record(attempt, o, { id: session.id, url: session.url, expires: open ? iso(session.expires_at) : CLOSED }).catch(() => false);
    if (!recorded) {
      // The row does not hold this session: it must not stay payable. Expire it; if that cannot be confirmed either,
      // the next request recovers it with the same key before anything else is allowed.
      if (open) await d.stripe.expireSession(session.id).catch(() => null);
      return { kind: 'unknown', detail: 'record' };
    }
    return open ? { kind: 'open', session } : { kind: 'closed' };
  };

  let plan = await d.db.begin(offer);
  for (let step = 0; step < 3; step++) {
    if (plan.error || !plan.row) return retry('begin');
    const row = plan.row;
    if (row.action === 'reuse' && row.url) return { status: 200, body: { url: row.url, reused: true, offer } };
    if (row.action === 'create') {
      const r = await settle(row.attempt, offer);
      if (r.kind === 'open') return { status: 200, body: { url: r.session.url, offer } };
      if (r.kind === 'paid') return { status: 409, body: { error: 'checkout_completing', offer } };
      if (r.kind === 'unknown') return retry(r.detail);
      plan = await d.db.begin(offer); // recorded as closed → a new attempt
      continue;
    }
    // conflict with another offer
    const held = (row.offer ?? 'curso') as VdOffer;
    if (row.reason === 'in_progress') return { status: 409, body: { error: 'checkout_in_progress', offer: held } };
    let heldSession = row.session_id;
    if (row.reason === 'unrecorded') {
      // Never assume "not recorded" means "no session": recover the held offer's session with its stable key first.
      const r = await settle(row.attempt, held);
      if (r.kind === 'paid') return { status: 409, body: { error: 'checkout_completing', offer: held } };
      if (r.kind === 'unknown') return retry(r.detail);
      if (r.kind === 'closed') { plan = await d.db.begin(offer); continue; }
      heldSession = r.session.id;
    }
    if (body.replace !== true || !heldSession) return { status: 409, body: { error: 'checkout_open', offer: held } };
    // Cambio explícito de oferta: la sesión anterior debe quedar caducada en Stripe antes de crear otra.
    const expired = await d.stripe.expireSession(heldSession).catch(() => ({ status: null }));
    if (expired.status === 'complete') return { status: 409, body: { error: 'checkout_completing', offer: held } };
    if (expired.status !== 'expired') return retry('expire');
    await d.db.release(heldSession);
    plan = await d.db.begin(offer);
  }
  return retry('loop');
}

export const VD_CHECKOUT_PRODUCT = VD_PRODUCT;
