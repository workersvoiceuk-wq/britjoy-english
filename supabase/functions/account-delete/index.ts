// Deletes the signed-in learner's account (required by Google Play and the App
// Store for apps with sign-up): cancels any Britjoy Plus subscription in Stripe,
// then deletes the auth user; profiles and AI usage go with it (on delete cascade).
// Purchase records are kept without the user id, as accounting records.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { admin, cors, currentUser, json, preflight } from "../_shared/http.ts";
import { stripe } from "../_shared/stripe.ts";

Deno.serve(async (req: Request) => {
  const headers = cors(req.headers.get("origin"));
  const early = preflight(req, headers);
  if (early) return early;

  const user = await currentUser(req);
  if (!user) return json({ error: "sign_in" }, 401, headers);

  const db = admin();
  const { data: profile } = await db.from("profiles").select("stripe_customer_id").eq("id", user.id).maybeSingle();
  const client = stripe();
  if (profile?.stripe_customer_id && client) {
    const subs = await client.subscriptions.list({ customer: profile.stripe_customer_id, status: "all", limit: 20 });
    for (const sub of subs.data) {
      if (!["canceled", "incomplete_expired"].includes(sub.status)) await client.subscriptions.cancel(sub.id);
    }
  }

  const { error } = await db.auth.admin.deleteUser(user.id);
  if (error) return json({ error: "delete_failed" }, 500, headers);
  return json({ deleted: true }, 200, headers);
});
