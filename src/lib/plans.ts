/**
 * Britjoy Plus offer shown in the app. The amounts here are only what the screen
 * displays; the real price is whatever the owner sets in Stripe. Keep both in sync
 * (or set VITE_PRICE_* in GitHub Variables to change the display without code).
 */
import type { ProductId } from './backend';

const env = import.meta.env as Record<string, string | undefined>;

export const CURRENCY = env.VITE_PRICE_CURRENCY || 'GBP';

export const PRICES: Record<ProductId, number> = {
  plus_month: Number(env.VITE_PRICE_PLUS_MONTH || 4.99),
  plus_year: Number(env.VITE_PRICE_PLUS_YEAR || 39.99),
  credits_100: Number(env.VITE_PRICE_CREDITS_100 || 2.99),
};

/** Free AI messages a day for signed-in learners (must match FREE_AI_DAILY on the server). */
export const FREE_AI_DAILY = Number(env.VITE_FREE_AI_DAILY || 5);

export const CREDIT_PACK = 100;

export function formatPrice(amount: number, lang: string, currency = CURRENCY): string {
  try {
    return new Intl.NumberFormat(lang, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/** Percentage saved by paying yearly instead of 12 monthly payments. */
export function yearlySaving(month = PRICES.plus_month, year = PRICES.plus_year): number {
  if (month <= 0) return 0;
  return Math.max(0, Math.round((1 - year / (month * 12)) * 100));
}
