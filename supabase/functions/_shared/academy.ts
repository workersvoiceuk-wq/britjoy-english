// VUM Academy is sold on vozunidamundo.com with the SAME Stripe account. A learner
// whose verified BritJoy email matches the email of an active VUM Academy
// subscription gets the app's paid features ("plus_until" in profiles).
// STRIPE_ACADEMY_PRICE_IDS lists the Academy price IDs (comma-separated), so a
// VUM Básica membership or any other product never unlocks the app.
import { Stripe, periodEnd } from "./stripe.ts";

const LIVE = new Set(["active", "trialing", "past_due"]);

export function academyPriceIds(): Set<string> {
  return new Set((Deno.env.get("STRIPE_ACADEMY_PRICE_IDS") ?? "").split(",").map((s) => s.trim()).filter(Boolean));
}

export function isAcademySubscription(sub: Stripe.Subscription, prices = academyPriceIds()): boolean {
  return sub.items.data.some((item) => prices.has(item.price.id));
}

/** End of the paid VUM Academy period for this email, or null when none is live. */
export async function academyStatusForEmail(
  client: Stripe,
  email: string,
): Promise<{ until: Date | null; customer: string | null }> {
  const prices = academyPriceIds();
  if (prices.size === 0) return { until: null, customer: null };
  const customers = await client.customers.list({ email, limit: 10 });
  let until: Date | null = null;
  let customer: string | null = null;
  for (const c of customers.data) {
    const subs = await client.subscriptions.list({ customer: c.id, status: "all", limit: 20 });
    for (const sub of subs.data) {
      if (!LIVE.has(sub.status) || !isAcademySubscription(sub, prices)) continue;
      const end = periodEnd(sub);
      if (end && (!until || end > until)) {
        until = end;
        customer = c.id;
      }
    }
  }
  return { until, customer };
}
