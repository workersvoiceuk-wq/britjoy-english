// What the BritJoy app sells itself: only AI credit packs. The subscription is
// VUM Academy, sold on vozunidamundo.com (see _shared/academy.ts). The price ID is
// a Supabase secret, so changing the price never needs a new app build.
export type ProductId = "credits_100";

export const PRODUCTS: Record<ProductId, { priceEnv: string; mode: "payment"; credits: number }> = {
  credits_100: { priceEnv: "STRIPE_PRICE_CREDITS_100", mode: "payment", credits: 100 },
};

export const isProduct = (p: unknown): p is ProductId => typeof p === "string" && p in PRODUCTS;

/** Free AI messages per day for every signed-in learner. */
export const FREE_AI_DAILY = Number(Deno.env.get("FREE_AI_DAILY") ?? "5");

/** Fair-use daily AI messages for VUM Academy members (see docs/PRECIOS.md). */
export const PLUS_AI_DAILY = Number(Deno.env.get("PLUS_AI_DAILY") ?? "15");
