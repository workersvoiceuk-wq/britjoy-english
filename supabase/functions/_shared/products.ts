// What can be bought. Prices are set in Stripe (Products → Prices); each product's
// price ID is a Supabase secret, so changing a price never needs a new app build.
export type ProductId = "plus_month" | "plus_year" | "credits_100";

export const PRODUCTS: Record<ProductId, { priceEnv: string; mode: "subscription" | "payment"; credits: number }> = {
  plus_month: { priceEnv: "STRIPE_PRICE_PLUS_MONTH", mode: "subscription", credits: 0 },
  plus_year: { priceEnv: "STRIPE_PRICE_PLUS_YEAR", mode: "subscription", credits: 0 },
  credits_100: { priceEnv: "STRIPE_PRICE_CREDITS_100", mode: "payment", credits: 100 },
};

export const isProduct = (p: unknown): p is ProductId => typeof p === "string" && p in PRODUCTS;

/** Free AI messages per day for every signed-in learner. */
export const FREE_AI_DAILY = Number(Deno.env.get("FREE_AI_DAILY") ?? "5");
