// Deletes the signed-in learner's BritJoy account (required by Google Play and the
// App Store for apps with sign-up). Profiles and AI usage go with it (on delete
// cascade); purchase records are kept without the user id, as accounting records.
// It does NOT cancel any Stripe subscription: VUM Academy is a Voz Unida Mundo
// subscription managed on vozunidamundo.com, shared with the website.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { admin, cors, currentUser, json, preflight } from "../_shared/http.ts";

Deno.serve(async (req: Request) => {
  const headers = cors(req.headers.get("origin"));
  const early = preflight(req, headers);
  if (early) return early;

  const user = await currentUser(req);
  if (!user) return json({ error: "sign_in" }, 401, headers);

  const { error } = await admin().auth.admin.deleteUser(user.id);
  if (error) return json({ error: "delete_failed" }, 500, headers);
  return json({ deleted: true }, 200, headers);
});
