// Opens Stripe's customer portal so a learner can change or cancel Britjoy Plus
// and download receipts.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { APP_URL, admin, cors, currentUser, json, preflight } from "../_shared/http.ts";
import { stripe } from "../_shared/stripe.ts";

Deno.serve(async (req: Request) => {
  const headers = cors(req.headers.get("origin"));
  const early = preflight(req, headers);
  if (early) return early;

  const user = await currentUser(req);
  if (!user) return json({ error: "sign_in" }, 401, headers);
  const client = stripe();
  if (!client) return json({ error: "not_configured" }, 503, headers);

  const { data: profile } = await admin().from("profiles").select("stripe_customer_id").eq("id", user.id).maybeSingle();
  if (!profile?.stripe_customer_id) return json({ error: "no_customer" }, 404, headers);

  const session = await client.billingPortal.sessions.create({ customer: profile.stripe_customer_id, return_url: APP_URL });
  return json({ url: session.url }, 200, headers);
});
