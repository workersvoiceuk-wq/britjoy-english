/**
 * VUM Academy offer shown in the app. How these prices were chosen: docs/PRECIOS.md.
 * The amounts here are only what the screen
 * displays; the real price is whatever the owner sets in Stripe. Keep both in sync
 * (or set VITE_PRICE_* in GitHub Variables to change the display without code).
 */
import type { ProductId } from './backend';

const env = import.meta.env as Record<string, string | undefined>;

export const CURRENCY = env.VITE_PRICE_CURRENCY || 'GBP';

/** VUM Academy monthly price as shown on vozunidamundo.com (Voz Unida Mundo sets it in Stripe). */
export const ACADEMY_MONTHLY = Number(env.VITE_PRICE_ACADEMY_MONTH || 5.99);

/** What the app sells itself. */
export const PRICES: Record<ProductId, number> = {
  credits_100: Number(env.VITE_PRICE_CREDITS_100 || 2.99),
};

/** Free AI messages a day for signed-in learners (must match FREE_AI_DAILY on the server). */
export const FREE_AI_DAILY = Number(env.VITE_FREE_AI_DAILY || 5);

/** Fair-use AI messages a day with VUM Academy (must match PLUS_AI_DAILY on the server). */
export const PLUS_AI_DAILY = Number(env.VITE_PLUS_AI_DAILY || 15);

export const CREDIT_PACK = 100;

export function formatPrice(amount: number, lang: string, currency = CURRENCY): string {
  try {
    return new Intl.NumberFormat(lang, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/** Percentage saved by paying yearly instead of 12 monthly payments. */
export function yearlySaving(month: number, year: number): number {
  if (month <= 0) return 0;
  return Math.max(0, Math.round((1 - year / (month * 12)) * 100));
}
