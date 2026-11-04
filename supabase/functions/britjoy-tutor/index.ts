// Britjoy AI tutor: Supabase Edge Function that proxies the app's "Modo IA" chat
// to the Claude Messages API. The API key lives ONLY here, as the Supabase secret
// ANTHROPIC_API_KEY; it is never shipped in the web or mobile app.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk";

const MODEL = "claude-opus-5-5";
const MAX_TURNS = 20; // conversation history sent per request
const MAX_CHARS = 1200; // per user message
const PER_MINUTE = 8; // requests per client per minute (best-effort, per instance)

// Origins allowed to call the tutor: the web app and the Capacitor apps.
const ALLOWED_ORIGINS = new Set([
  "https://workersvoiceuk-wq.github.io",
  "capacitor://localhost", // iOS app
  "https://localhost", // Android app
  "http://localhost:5173", // local development
  "http://localhost:4173",
]);

// Static system prompt (kept byte-identical so it can be served from the prompt cache).
const SYSTEM = `You are Britjoy, a friendly British lion in a Queen's Guard uniform who tutors Spanish speakers in English and helps them with everyday life in the United Kingdom, inside the "Britjoy English" app by Voz Unida Mundo Academy.

How to help:
- Reply in Spanish by default, with English examples in bold. If the learner writes in English, answer in simple English adapted to their level (A1-C2) and add a short Spanish gloss when useful.
- Keep answers short and practical: at most about 120 words, a few lines or a short list. Encourage, correct gently, and give one example the learner can say out loud.
- When the learner asks you to correct a sentence, show the corrected sentence, then explain the change in one line.
- You can role-play real situations (GP receptionist, landlord, job interview, border officer, café, museum ticket desk) when asked; stay in character and keep turns short.

Safety and accuracy:
- For UK rules, money, benefits, immigration, health or legal questions, give general guidance only, say that rules and amounts change, and point to the official source (GOV.UK, NHS, TfL, Citizens Advice). Never present yourself as legal, immigration, medical or financial advice.
- In an emergency, tell the learner to call 999 (or 111 for urgent but non-emergency health problems).
- Never ask for personal data. If the learner shares passwords, passport, bank or share-code numbers, tell them not to and do not repeat them.
- Stay on topic: English learning and practical life in the UK (and Spain basics covered by the course). Politely decline anything else.`;

const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment
const hits = new Map<string, number[]>();

function cors(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://workersvoiceuk-wq.github.io";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > PER_MINUTE;
}

type Turn = { role: "user" | "assistant"; content: string };

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const headers = cors(origin);
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, headers);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: "origin_not_allowed" }, 403, headers);

  const client = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(client)) return json({ error: "rate_limited" }, 429, headers);

  let body: { messages?: Turn[]; level?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400, headers);
  }

  const turns = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  if (turns.length === 0 || turns[0].role !== "user" || turns[turns.length - 1].role !== "user") {
    return json({ error: "invalid_messages" }, 400, headers);
  }
  const level = /^(A1|A2|B1|B2|C1|C2)$/.test(body.level ?? "") ? body.level : "A1";

  try {
    const response = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: 2048, // deliberately short tutor replies
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default", // if a request is declined, the API retries it on a fallback model
      output_config: { effort: "low" },
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [
        ...turns.slice(0, -1),
        { role: "user", content: `[Nivel del alumno: ${level}]\n${turns[turns.length - 1].content}` },
      ],
    });

    if (response.stop_reason === "refusal") {
      return json({ reply: "Lo siento, no puedo ayudarte con eso. ¿Practicamos inglés o vemos algo de la vida en UK?" }, 200, headers);
    }
    const reply = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return json({ reply: reply || "¿Me lo puedes preguntar de otra forma?" }, 200, headers);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return json({ error: "busy" }, 429, headers);
    if (error instanceof Anthropic.AuthenticationError) return json({ error: "not_configured" }, 503, headers);
    if (error instanceof Anthropic.APIError) return json({ error: "upstream", status: error.status }, 502, headers);
    return json({ error: "unavailable" }, 503, headers);
  }
});
