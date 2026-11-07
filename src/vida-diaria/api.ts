// «Inglés para el día a día»: talks to the server (Supabase Edge Functions). The access state shown in the page is
// whatever the server says; nothing in the browser can unlock a paid module. Paid lessons are kept in memory only.
import { backendConfigured, callFunction, callFunctionRaw, currentSession, manageSubscription } from '../lib/backend';
import type { Unit } from '../types';
import sample from '../data/courses/dia-a-dia/01-presentaciones.json';

export interface AccessStatus {
  active: boolean;
  status: 'none' | 'expired' | string;
  until: string | null;
  cancelAtPeriodEnd: boolean;
  price: { amount: number; currency: string; interval: string; display: string };
}

export type AccessView =
  | { kind: 'offline' } // no backend configured in this build (e.g. a preview): sample only
  | { kind: 'signed-out' }
  | { kind: 'error' }
  | ({ kind: 'status' } & AccessStatus);

export const SAMPLE_MODULE_ID = '01-presentaciones';
export const SAMPLE_UNIT = sample as unknown as Unit;

export async function loadAccess(): Promise<AccessView> {
  if (!backendConfigured) return { kind: 'offline' };
  if (!(await currentSession())) return { kind: 'signed-out' };
  const { ok, data } = await callFunction<AccessStatus>('vida-diaria', { action: 'status' });
  return ok ? { kind: 'status', ...data } : { kind: 'error' };
}

const cache = new Map<string, Unit>();

export type ModuleLoad = { kind: 'ok'; unit: Unit } | { kind: 'locked' } | { kind: 'signed-out' } | { kind: 'error' };

export async function loadModule(id: string): Promise<ModuleLoad> {
  if (id === SAMPLE_MODULE_ID) return { kind: 'ok', unit: SAMPLE_UNIT };
  const hit = cache.get(id);
  if (hit) return { kind: 'ok', unit: hit };
  if (!backendConfigured || !(await currentSession())) return { kind: 'signed-out' };
  const { ok, status, data } = await callFunction<{ module?: Unit }>('vida-diaria', { action: 'module', module: id });
  if (status === 402) return { kind: 'locked' };
  if (status === 401) return { kind: 'signed-out' };
  if (!ok || !data.module) return { kind: 'error' };
  cache.set(id, data.module);
  return { kind: 'ok', unit: data.module };
}

/** Forget paid content (sign-out or access change). */
export const clearModuleCache = () => {
  cache.clear();
  for (const url of mediaCache.values()) URL.revokeObjectURL(url);
  mediaCache.clear();
};

export async function startCheckout(): Promise<'redirected' | 'already_active' | 'live_disabled' | 'not_configured' | 'error'> {
  const { ok, status, data } = await callFunction<{ url?: string; error?: string }>('billing-checkout', { product: 'vida_diaria_monthly' });
  if (ok && data.url) {
    window.location.assign(data.url);
    return 'redirected';
  }
  if (status === 409) return 'already_active';
  if (data.error === 'live_disabled') return 'live_disabled';
  if (data.error === 'not_configured') return 'not_configured';
  return 'error';
}

const mediaCache = new Map<string, string>();

/** Paid module animation or captions as an in-memory object URL (never a public URL). */
export async function loadMedia(module: string, kind: 'video' | 'es' | 'en', source: 'flow' | 'animacion' = 'animacion'): Promise<string | null> {
  const key = `${module}:${source}:${kind}`;
  const hit = mediaCache.get(key);
  if (hit) return hit;
  if (!backendConfigured || !(await currentSession())) return null;
  const res = await callFunctionRaw('vida-diaria', { action: 'media', module, kind, source: source === 'flow' ? 'flow' : 'capitulo' });
  if (!res.ok) return null;
  const url = URL.createObjectURL(await res.blob());
  mediaCache.set(key, url);
  return url;
}

export { manageSubscription };
