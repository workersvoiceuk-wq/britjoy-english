// Starts a Stripe Checkout for an AI credit pack (web only; the store apps do not
// sell digital goods outside Google Play / App Store billing). The subscription,
// VUM Academy, is sold on vozunidamundo.com.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { APP_URL, VIDA_DIARIA_URL, admin, cors, currentUser, json, preflight } from "../_shared/http.ts";
import { PRODUCTS, isProduct } from "../_shared/products.ts";
import { Stripe, stripe } from "../_shared/stripe.ts";
import { VD_PRODUCT, automaticTaxEnabled, type CourseAccessRow } from "../_shared/vida-diaria.ts";
import { vidaDiariaCheckout, type BeginRow } from "../_shared/vida-diaria-checkout.ts";

Deno.serve(async (req: Request) => {
  const headers = cors(req.headers.get("origin"));
  const early = preflight(req, headers);
  if (early) return early;

  const user = await currentUser(req);
  if (!user) return json({ error: "sign_in" }, 401, headers);
  const client = stripe();
  if (!client) return json({ error: "not_configured" }, 503, headers);

  const body = (await req.json().catch(() => ({}))) as { product?: unknown; offer?: unknown; replace?: unknown };
  const { product } = body;
  if (product === VD_PRODUCT) {
    // La lógica vive en _shared/vida-diaria-checkout.ts (probada con dobles); aquí solo se conectan Stripe y Supabase.
    const db = admin();
    const result = await vidaDiariaCheckout(body, {
      env: (name) => Deno.env.get(name),
      user: { id: user.id, email: user.email },
      returnUrl: VIDA_DIARIA_URL,
      // Stripe Tax solo cuando el dueño confirme el tratamiento del IVA: VIDA_DIARIA_AUTOMATIC_TAX=on.
      automaticTax: automaticTaxEnabled(Deno.env.get("VIDA_DIARIA_AUTOMATIC_TAX")),
      stripe: {
        retrievePrice: (id) => client.prices.retrieve(id),
        createSession: (params, idempotencyKey) =>
          client.checkout.sessions.create(params as Stripe.Checkout.SessionCreateParams, { idempotencyKey }),
        retrieveSession: async (id) => {
          const s = await client.checkout.sessions.retrieve(id);
          return { id: s.id, url: s.url, expires_at: s.expires_at, status: s.status };
        },
        expireSession: async (id) => {
          try {
            return { status: (await client.checkout.sessions.expire(id)).status };
          } catch {
            // Ya caducada o completada: se informa su estado real.
            return { status: (await client.checkout.sessions.retrieve(id)).status };
          }
        },
      },
      db: {
        access: async () => {
          const { data, error } = await db.from("course_access").select("*").eq("user_id", user.id).eq("product", VD_PRODUCT).maybeSingle();
          return { row: (data as CourseAccessRow | null) ?? null, error };
        },
        begin: async (offer) => {
          const { data, error } = await db.rpc("begin_course_checkout", { p_user: user.id, p_product: VD_PRODUCT, p_offer: offer }).single();
          return { row: (data as BeginRow | null) ?? null, error };
        },
        // Solo cuenta como registrada si la función confirma que la fila guarda esta sesión (true); un error no lanza.
        record: async (attempt, offer, session) => {
          const { data, error } = await db.rpc("record_course_checkout", {
            p_user: user.id, p_product: VD_PRODUCT, p_attempt: attempt, p_offer: offer, p_session: session.id, p_url: session.url, p_expires: session.expires,
          });
          return !error && data === true;
        },
        release: async (session) => {
          await db.rpc("release_course_checkout", { p_user: user.id, p_product: VD_PRODUCT, p_session: session });
        },
      },
    });
    return json(result.body, result.status, headers);
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
