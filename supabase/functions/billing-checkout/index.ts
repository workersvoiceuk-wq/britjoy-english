// Starts a Stripe Checkout for an AI credit pack (web only; the store apps do not
// sell digital goods outside Google Play / App Store billing). The subscription,
// VUM Academy, is sold on vozunidamundo.com.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { APP_URL, VIDA_DIARIA_URL, admin, cors, currentUser, json, preflight } from "../_shared/http.ts";
import { PRODUCTS, isProduct } from "../_shared/products.ts";
import { Stripe, stripe } from "../_shared/stripe.ts";
import {
  VD_PRODUCT, automaticTaxEnabled, canStartCheckout, checkoutIdempotencyKey, checkoutParams, liveChargesAllowed, vdPriceIds,
  type CourseAccessRow,
} from "../_shared/vida-diaria.ts";

Deno.serve(async (req: Request) => {
  const headers = cors(req.headers.get("origin"));
  const early = preflight(req, headers);
  if (early) return early;

  const user = await currentUser(req);
  if (!user) return json({ error: "sign_in" }, 401, headers);
  const client = stripe();
  if (!client) return json({ error: "not_configured" }, 503, headers);

  const { product } = (await req.json().catch(() => ({}))) as { product?: unknown };
  if (product === VD_PRODUCT) {
    // Cobros reales apagados hasta que el dueño ponga VIDA_DIARIA_LIVE=on tras verificar el acceso en modo de prueba.
    if (!liveChargesAllowed(Deno.env.get("STRIPE_SECRET_KEY"), Deno.env.get("VIDA_DIARIA_LIVE"))) {
      return json({ error: "live_disabled" }, 503, headers);
    }
    const price = [...vdPriceIds(Deno.env.get("STRIPE_PRICE_VIDA_DIARIA"))][0];
    if (!price) return json({ error: "not_configured" }, 503, headers);
    const db = admin();
    const { data: access, error: accessError } = await db.from("course_access").select("*").eq("user_id", user.id).eq("product", VD_PRODUCT).maybeSingle();
    if (accessError) return json({ error: "retry" }, 503, headers);
    if (!canStartCheckout(access as CourseAccessRow | null)) return json({ error: "already_active" }, 409, headers);
    // Una sesión abierta por alumno: decisión tomada con bloqueo en la base de datos (begin_course_checkout).
    const { data: plan, error: planError } = await db.rpc("begin_course_checkout", { p_user: user.id, p_product: VD_PRODUCT }).single();
    if (planError || !plan) return json({ error: "retry" }, 503, headers);
    const step = plan as { action: string; attempt: number; url: string | null };
    if (step.action === "reuse" && step.url) return json({ url: step.url, reused: true }, 200, headers);
    const { data: profile } = await db.from("profiles").select("stripe_customer_id").eq("id", user.id).maybeSingle();
    const params = checkoutParams({
      price, user: user.id, email: user.email, customer: (access as CourseAccessRow | null)?.stripe_customer_id ?? profile?.stripe_customer_id ?? null,
      returnUrl: VIDA_DIARIA_URL,
      // Stripe Tax solo cuando el dueño confirme el tratamiento del IVA: VIDA_DIARIA_AUTOMATIC_TAX=on.
      automaticTax: automaticTaxEnabled(Deno.env.get("VIDA_DIARIA_AUTOMATIC_TAX")),
    });
    // Clave estable por (alumno, intento): peticiones simultáneas reciben la MISMA sesión de Stripe.
    const session = await client.checkout.sessions.create(params as Stripe.Checkout.SessionCreateParams, {
      idempotencyKey: checkoutIdempotencyKey(user.id, step.attempt),
    });
    await db.rpc("record_course_checkout", {
      p_user: user.id, p_product: VD_PRODUCT, p_attempt: step.attempt, p_session: session.id, p_url: session.url,
      p_expires: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
    });
    return json({ url: session.url }, 200, headers);
  }
  if (!isProduct(product)) return json({ error: "invalid_product" }, 400, headers);
  const spec = PRODUCTS[product];
  const price = Deno.env.get(spec.priceEnv);
  if (!price) return json({ error: "not_configured" }, 503, headers);

  // Reuse the learner's Stripe customer so subscriptions and receipts stay together.
  const db = admin();
  const { data: profile } = await db.from("profiles").select("stripe_customer_id").eq("id", user.id).maybeSingle();

  const session = await client.checkout.sessions.create({
    mode: spec.mode,
    line_items: [{ price, quantity: 1 }],
    client_reference_id: user.id,
    metadata: { user_id: user.id, product },
    ...(profile?.stripe_customer_id
      ? { customer: profile.stripe_customer_id }
      : { customer_email: user.email, customer_creation: "always" as const }),
    allow_promotion_codes: true,
    success_url: `${APP_URL}?plus=ok`,
    cancel_url: `${APP_URL}?plus=cancel`,
  });
  return json({ url: session.url }, 200, headers);
});
