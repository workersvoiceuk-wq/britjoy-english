// Stripe client for the billing functions. STRIPE_SECRET_KEY is a Supabase secret
// set by the owner in the dashboard; it never appears in the repository or the app.
import Stripe from "npm:stripe@23.0.0";

export { Stripe };

export function stripe(): Stripe | null {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  return key ? new Stripe(key, { httpClient: Stripe.createFetchHttpClient() }) : null;
}

/** End of the subscription's current paid period (newer API versions keep it on the item). */
export function periodEnd(sub: Stripe.Subscription): Date | null {
  const raw = (sub.items?.data?.[0] as { current_period_end?: number } | undefined)?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end;
  return raw ? new Date(raw * 1000) : null;
}
