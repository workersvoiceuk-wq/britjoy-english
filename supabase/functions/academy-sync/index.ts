// "I already have VUM Academy": checks Stripe for an active VUM Academy
// subscription with the signed-in learner's verified email and updates the
// app's paid access. Read-only on Stripe; the server decides, never the app.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { academyStatusForEmail } from "../_shared/academy.ts";
import { admin, cors, currentUser, json, preflight } from "../_shared/http.ts";
import { stripe } from "../_shared/stripe.ts";

Deno.serve(async (req: Request) => {
  const headers = cors(req.headers.get("origin"));
  const early = preflight(req, headers);
  if (early) return early;

  const user = await currentUser(req);
  if (!user?.email || !user.email_confirmed_at) return json({ error: "sign_in" }, 401, headers);
  const client = stripe();
  if (!client) return json({ error: "not_configured" }, 503, headers);

  const { until, customer } = await academyStatusForEmail(client, user.email);
  const db = admin();
  const { data: profile } = await db.from("profiles").select("plus_until").eq("id", user.id).maybeSingle();
  const current = profile?.plus_until ? new Date(profile.plus_until) : null;
  // A live subscription sets the end of the paid period; none ends access now.
  const next = until ?? (current && current > new Date() ? new Date() : current);
  await db.from("profiles").upsert({
    id: user.id,
    plus_until: next ? next.toISOString() : null,
    ...(customer ? { stripe_customer_id: customer } : {}),
  });
  return json({ active: Boolean(until), plusUntil: until ? until.toISOString() : null }, 200, headers);
});
