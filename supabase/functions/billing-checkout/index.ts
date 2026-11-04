// Starts a Stripe Checkout for an AI credit pack (web only; the store apps do not
// sell digital goods outside Google Play / App Store billing). The subscription,
// VUM Academy, is sold on vozunidamundo.com.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { APP_URL, admin, cors, currentUser, json, preflight } from "../_shared/http.ts";
import { PRODUCTS, isProduct } from "../_shared/products.ts";
import { stripe } from "../_shared/stripe.ts";

Deno.serve(async (req: Request) => {
  const headers = cors(req.headers.get("origin"));
  const early = preflight(req, headers);
  if (early) return early;

  const user = await currentUser(req);
  if (!user) return json({ error: "sign_in" }, 401, headers);
  const client = stripe();
  if (!client) return json({ error: "not_configured" }, 503, headers);

  const { product } = (await req.json().catch(() => ({}))) as { product?: unknown };
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
