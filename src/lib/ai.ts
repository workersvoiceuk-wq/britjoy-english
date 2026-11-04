/**
 * Client for Britjoy's AI tutor (Modo IA). The tutor runs as a Supabase Edge
 * Function; the Claude API key stays on the server (see supabase/README.md).
 * Learners sign in; Britjoy Plus is unlimited, everyone gets a few free messages
 * a day, and then each message uses one credit.
 */
import { backendConfigured, callFunction, currentSession, useAccount } from './backend';

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

export function aiConfigured(): boolean {
  return backendConfigured;
}

/** Error codes the screen can react to (e.g. show sign-in or Plus). */
export class AiError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

const ERRORS: Record<string, string> = {
  rate_limited: 'Vas muy rápido. Espera un minuto y vuelve a intentarlo.',
  busy: 'Hay mucha gente hablando con Britjoy. Inténtalo en un momento.',
  not_configured: 'El Modo IA todavía no está activado.',
  sign_in: 'Inicia sesión para hablar con Britjoy.',
  no_credits: 'Has usado tus mensajes gratis de hoy. Hazte Britjoy Plus o consigue créditos para seguir.',
};

type Usage = { paidWith?: string; freeLeft?: number; credits?: number };

export async function askBritjoy(messages: ChatTurn[], level: string): Promise<string> {
  if (!backendConfigured) throw new AiError('not_configured', ERRORS.not_configured);
  if (!(await currentSession())) throw new AiError('sign_in', ERRORS.sign_in);
  let result: { ok: boolean; data: { reply?: string; error?: string; usage?: Usage } };
  try {
    result = await callFunction('britjoy-tutor', { messages, level });
  } catch {
    throw new AiError('offline', 'Sin conexión. Revisa tu internet e inténtalo otra vez.');
  }
  const { ok, data } = result;
  if (data.usage) useAccount.getState().setUsage({ credits: data.usage.credits, freeLeft: data.usage.freeLeft });
  if (!ok || !data.reply) {
    const code = data.error ?? 'error';
    throw new AiError(code, ERRORS[code] ?? 'Britjoy no ha podido responder. Inténtalo otra vez.');
  }
  return data.reply;
}
