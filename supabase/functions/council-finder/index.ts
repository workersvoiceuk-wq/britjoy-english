// "Tu council": POST { postcode } → the UK council for that postcode (GOV.UK's official
// local-authority data). Public (no account needed): GOV.UK's API does not allow browser
// calls (no CORS), so the app asks through this function. No secrets, nothing stored.
import { cors, json, preflight } from "../_shared/http.ts";
import { findCouncil } from "../_shared/council.ts";

const cache = new Map<string, { at: number; body: unknown }>();
const DAY = 24 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  const headers = cors(req.headers.get("origin"));
  const early = preflight(req, headers);
  if (early) return early;
  const { postcode } = (await req.json().catch(() => ({}))) as { postcode?: string };
  if (typeof postcode !== "string" || postcode.length > 12) return json({ status: "invalid" }, 400, headers);
  const key = postcode.toUpperCase().replace(/\s+/g, "");
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < DAY) return json(hit.body, 200, headers);
  try {
    const result = await findCouncil(postcode);
    if (result.status === "ok" || result.status === "not_found") cache.set(key, { at: Date.now(), body: result });
    return json(result, result.status === "error" ? 502 : 200, headers);
  } catch {
    return json({ status: "error" }, 502, headers);
  }
});
