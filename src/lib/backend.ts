/**
 * Connection to Britjoy's backend (Supabase): accounts, VUM Academy, AI credits.
 * The app only ships the project's public URL and public (anon/publishable) key.
 * Every secret (Claude, Stripe) lives in Supabase, never in the app.
 */
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Capacitor } from '@capacitor/core';

const URL_ = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '');
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const backendConfigured = Boolean(URL_ && KEY);

let client: Promise<SupabaseClient | null> | null = null;

/**
 * The Supabase client, loaded on first use: learners who never sign in don't
 * download it, which keeps the first page light.
 */
export function getSupabase(): Promise<SupabaseClient | null> {
  if (!backendConfigured) return Promise.resolve(null);
  client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(URL_!, KEY!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }),
  );
  return client;
}

export const functionUrl = (name: string) => (URL_ ? `${URL_}/functions/v1/${name}` : '');

/** Store apps (Google Play / App Store) must not sell digital goods outside store billing. */
export const canBuyHere = () => !Capacitor.isNativePlatform();

export interface AccountState {
  email: string | null;
  /** ISO date until which VUM Academy is active (cached so it also works offline). */
  plusUntil: string | null;
  credits: number;
  /** Free AI messages left today, as last reported by the tutor. */
  freeLeft: number | null;
  setUsage: (u: { credits?: number; freeLeft?: number }) => void;
  setProfile: (p: { email: string | null; plusUntil: string | null; credits: number }) => void;
  clear: () => void;
}

export const useAccount = create<AccountState>()(
  persist(
    (set) => ({
      email: null,
      plusUntil: null,
      credits: 0,
      freeLeft: null,
      setUsage: (u) => set((s) => ({ credits: u.credits ?? s.credits, freeLeft: u.freeLeft ?? s.freeLeft })),
      setProfile: (p) => set(p),
      clear: () => set({ email: null, plusUntil: null, credits: 0, freeLeft: null }),
    }),
    { name: 'britjoy-english-account-v1', storage: createJSONStorage(() => localStorage) },
  ),
);

export function isPlusActive(plusUntil: string | null, now = Date.now()): boolean {
  return Boolean(plusUntil && Date.parse(plusUntil) > now);
}

/** True when the learner has VUM Academy right now. */
export const hasPlus = () => isPlusActive(useAccount.getState().plusUntil);

export async function currentSession(): Promise<Session | null> {
  const supabase = await getSupabase();
  if (!supabase) return null;
  return (await supabase.auth.getSession()).data.session;
}

/** Re-reads the learner's Plus status and credits from the server. */
export async function refreshProfile(): Promise<void> {
  const supabase = await getSupabase();
  const session = await currentSession();
  if (!supabase || !session) {
    useAccount.getState().clear();
    return;
  }
  const { data } = await supabase.from('profiles').select('plus_until, credits').eq('id', session.user.id).maybeSingle();
  useAccount.getState().setProfile({
    email: session.user.email ?? null,
    plusUntil: (data?.plus_until as string | null) ?? null,
    credits: (data?.credits as number | undefined) ?? 0,
  });
}

/** Step 1 of signing in: Supabase emails a 6-digit code (no password to remember). */
export async function sendLoginCode(email: string): Promise<void> {
  const supabase = await getSupabase();
  if (!supabase) throw new Error('not_configured');
  const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
  if (error) throw error;
}

/** Step 2: the learner types the code from the email. */
export async function verifyLoginCode(email: string, code: string): Promise<void> {
  const supabase = await getSupabase();
  if (!supabase) throw new Error('not_configured');
  const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
  if (error) throw error;
  await refreshProfile();
}

export async function signOut(): Promise<void> {
  await (await getSupabase())?.auth.signOut();
  useAccount.getState().clear();
}

/** Calls one of Britjoy's Edge Functions as the signed-in learner. */
export async function callFunction<T>(name: string, body: unknown): Promise<{ ok: boolean; status: number; data: T }> {
  const session = await currentSession();
  const res = await fetch(functionUrl(name), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: KEY ?? '',
      Authorization: `Bearer ${session?.access_token ?? KEY ?? ''}`,
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

export type ProductId = 'credits_100';

/** VUM Academy is sold on Voz Unida Mundo's website; it unlocks the app by email. */
export const VUM_ACADEMY_URL = 'https://vozunidamundo.com/academia/plan/';

/** Asks the server to look for an active VUM Academy subscription with this account's email. */
export async function syncAcademy(): Promise<boolean> {
  const { ok, data } = await callFunction<{ active?: boolean; error?: string }>('academy-sync', {});
  if (!ok) throw new Error(data.error ?? 'sync_failed');
  await refreshProfile();
  return Boolean(data.active);
}

/** Opens Stripe Checkout (web) for an AI credit pack. */
export async function buy(product: ProductId): Promise<void> {
  const { ok, data } = await callFunction<{ url?: string; error?: string }>('billing-checkout', { product });
  if (!ok || !data.url) throw new Error(data.error ?? 'checkout_failed');
  window.location.assign(data.url);
}

/** Opens Stripe's portal to change or cancel VUM Academy and see receipts. */
export async function manageSubscription(): Promise<void> {
  const { ok, data } = await callFunction<{ url?: string; error?: string }>('billing-portal', {});
  if (!ok || !data.url) throw new Error(data.error ?? 'portal_failed');
  window.location.assign(data.url);
}

/** React hook: whether the learner has VUM Academy (re-renders when it changes). */
export const usePlus = () => useAccount((s) => isPlusActive(s.plusUntil));

/** Deletes the account on the server (and cancels Plus), then signs out. */
export async function deleteAccount(): Promise<void> {
  const { ok } = await callFunction<{ deleted?: boolean }>('account-delete', {});
  if (!ok) throw new Error('delete_failed');
  await signOut();
}
