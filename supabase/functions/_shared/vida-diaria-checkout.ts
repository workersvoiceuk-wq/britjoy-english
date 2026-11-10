// «Inglés para el día a día» · Checkout de Stripe. Lógica sin Deno ni red: billing-checkout le pasa Stripe, la base de
// datos y la configuración; las pruebas le pasan dobles. Así el handler que se prueba es el mismo que se despliega.
//
// Una sola sesión pagable por alumno, y recuerda su oferta:
// - misma oferta y sesión abierta → la misma URL (reintentos y dobles clics);
// - OTRA oferta con sesión abierta → 409 checkout_open (con la oferta abierta); nunca se devuelve la URL de otra oferta;
// - cambio explícito ({ replace: true }) → se caduca la sesión anterior en Stripe y solo entonces se crea la nueva; si
//   la anterior ya no se puede caducar (se está pagando o se pagó) → 409 checkout_completing;
// - otra oferta mientras otra petición crea la sesión → 409 checkout_in_progress.
import {
  VD_PRODUCT, canStartCheckout, checkoutIdempotencyKey, checkoutParams, isVdOffer, liveChargesAllowed, offerPriceIds,
  orientationOnSale, vdPrices, verifyConceptPrice, type CourseAccessRow, type StripePriceLike, type VdOffer,
} from './vida-diaria.ts';

export interface BeginRow { action: 'reuse' | 'create' | 'conflict'; attempt: number; url: string | null; offer: VdOffer | null; session_id: string | null; reason: string | null }

export interface VdCheckoutDeps {
  env: (name: string) => string | undefined;
  user: { id: string; email?: string | null };
  returnUrl: string;
  automaticTax: boolean;
  stripe: {
    retrievePrice(id: string): Promise<StripePriceLike>;
    createSession(params: Record<string, unknown>, idempotencyKey: string): Promise<{ id: string; url: string | null; expires_at?: number | null }>;
    /** Expires an open session; resolves with its final status (also when it was already expired or complete). */
    expireSession(id: string): Promise<{ status: string | null }>;
  };
  db: {
    access(): Promise<{ row: CourseAccessRow | null; error?: unknown }>;
    begin(offer: VdOffer): Promise<{ row: BeginRow | null; error?: unknown }>;
    record(attempt: number, offer: VdOffer, session: { id: string; url: string | null; expires: string | null }): Promise<void>;
    /** Marks the learner's open session as finished once Stripe has expired it (only if it is still that session). */
    release(session: string): Promise<void>;
  };
}

export interface VdCheckoutResult { status: number; body: Record<string, unknown> }

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
  if (access.error) return { status: 503, body: { error: 'retry' } };
  if (!canStartCheckout(access.row)) return { status: 409, body: { error: 'already_active' } };

  let plan = await d.db.begin(offer);
  if (plan.error || !plan.row) return { status: 503, body: { error: 'retry' } };
  if (plan.row.action === 'conflict') {
    const held = plan.row.offer;
    if (plan.row.reason === 'in_progress') return { status: 409, body: { error: 'checkout_in_progress', offer: held } };
    if (body.replace !== true || !plan.row.session_id) return { status: 409, body: { error: 'checkout_open', offer: held } };
    // Cambio explícito de oferta: la sesión anterior debe quedar caducada en Stripe antes de crear otra.
    const old = plan.row.session_id;
    const expired = await d.stripe.expireSession(old).catch(() => ({ status: null }));
    if (expired.status !== 'expired') return { status: 409, body: { error: 'checkout_completing', offer: held } };
    await d.db.release(old);
    plan = await d.db.begin(offer);
    if (plan.error || !plan.row) return { status: 503, body: { error: 'retry' } };
    if (plan.row.action === 'conflict') return { status: 409, body: { error: plan.row.reason === 'in_progress' ? 'checkout_in_progress' : 'checkout_open', offer: plan.row.offer } };
  }
  if (plan.row.action === 'reuse' && plan.row.url) return { status: 200, body: { url: plan.row.url, reused: true, offer } };

  const params = checkoutParams({
    price, user: d.user.id, email: d.user.email, customer: access.row?.stripe_customer_id ?? null,
    returnUrl: d.returnUrl, automaticTax: d.automaticTax,
  });
  // Clave estable por (alumno, intento, oferta): peticiones simultáneas de la MISMA oferta reciben la misma sesión.
  const session = await d.stripe.createSession({ ...params, metadata: { ...(params.metadata as object), offer } }, checkoutIdempotencyKey(d.user.id, plan.row.attempt, offer));
  await d.db.record(plan.row.attempt, offer, {
    id: session.id, url: session.url, expires: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
  });
  return { status: 200, body: { url: session.url, offer } };
}

export const VD_CHECKOUT_PRODUCT = VD_PRODUCT;
