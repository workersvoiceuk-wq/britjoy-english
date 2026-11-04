/**
 * Client for Britjoy's AI tutor (Modo IA). The app only knows the public URL of
 * the Supabase Edge Function and the project's public "anon" key; the Claude API
 * key stays on the server (see supabase/README.md).
 */
const ENDPOINT = import.meta.env.VITE_AI_ENDPOINT as string | undefined;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

export function aiConfigured(): boolean {
  return Boolean(ENDPOINT);
}

const ERRORS: Record<string, string> = {
  rate_limited: 'Vas muy rápido. Espera un minuto y vuelve a intentarlo.',
  busy: 'Hay mucha gente hablando con Britjoy. Inténtalo en un momento.',
  not_configured: 'El Modo IA todavía no está activado.',
};

export async function askBritjoy(messages: ChatTurn[], level: string): Promise<string> {
  if (!ENDPOINT) throw new Error(ERRORS.not_configured);
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ANON_KEY ? { Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY } : {}),
      },
      body: JSON.stringify({ messages, level }),
    });
  } catch {
    throw new Error('Sin conexión. Revisa tu internet e inténtalo otra vez.');
  }
  const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
  if (!res.ok || !data.reply) throw new Error(ERRORS[data.error ?? ''] ?? 'Britjoy no ha podido responder. Inténtalo otra vez.');
  return data.reply;
}
