// Shared helpers for Britjoy English Edge Functions: CORS, JSON replies and the
// signed-in learner. Secrets come only from Supabase's environment.
import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2.117.3";

// Origins allowed to call the functions: the web app and the Capacitor apps.
export const ALLOWED_ORIGINS = new Set([
  "https://workersvoiceuk-wq.github.io",
  "https://ingles.vozunidamundo.com",
  "capacitor://localhost", // iOS app
  "https://localhost", // Android app
  "http://localhost:5173", // local development
  "http://localhost:4173",
]);

/** Where Stripe sends the learner back after paying (the published web app). */
export const APP_URL = Deno.env.get("APP_URL") ?? "https://workersvoiceuk-wq.github.io/britjoy-english/";

export function cors(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://workersvoiceuk-wq.github.io";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

export function json(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}

/** Service-role client: bypasses RLS, so it is only ever used inside these functions. */
export function admin(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** The learner behind the request's access token, or null when signed out. */
export async function currentUser(req: Request): Promise<User | null> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await admin().auth.getUser(token);
  return error ? null : data.user;
}

/** Handles CORS preflight and blocks unknown browser origins. Returns a response to send, or null. */
export function preflight(req: Request, headers: Record<string, string>): Response | null {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, headers);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: "origin_not_allowed" }, 403, headers);
  return null;
}
