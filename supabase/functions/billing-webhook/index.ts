// Receives Stripe events and grants what was paid for. Deployed WITHOUT JWT
// verification (Stripe cannot send a Supabase token); instead every request must
// carry a valid Stripe signature (STRIPE_WEBHOOK_SECRET). Each event is applied
// once (apply_purchase records the event id).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { admin } from "../_shared/http.ts";
import { PRODUCTS, isProduct } from "../_shared/products.ts";
import { Stripe, periodEnd, stripe } from "../_shared/stripe.ts";

const cryptoProvider = Stripe.createSubtleCryptoProvider();
const ok = () => new Response("ok", { status: 200 });

Deno.serve(async (req: Request) => {
  const client = stripe();
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!client || !secret) return new Response("not configured", { status: 503 });

  let event: Stripe.Event;
  try {
    event = await client.webhooks.constructEventAsync(
      await req.text(),
      req.headers.get("stripe-signature") ?? "",
      secret,
      undefined,
      cryptoProvider,
    );
  } catch {
    return new Response("bad signature", { status: 400 });
  }

  const db = admin();
  const apply = async (args: {
    user: string; product: string; credits?: number; plusUntil?: Date | null;
    amount?: number | null; currency?: string | null; customer?: string | null;
  }) => {
    const { error } = await db.rpc("apply_purchase", {
      p_event: event.id,
      p_user: args.user,
      p_product: args.product,
      p_credits: args.credits ?? 0,
      p_plus_until: args.plusUntil ? args.plusUntil.toISOString() : null,
      p_amount: args.amount ?? null,
      p_currency: args.currency ?? null,
      p_customer: args.customer ?? null,
    });
    if (error) throw error;
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const user = s.client_reference_id ?? s.metadata?.user_id;
        const product = s.metadata?.product;
        if (!user || !isProduct(product) || s.payment_status === "unpaid") break;
        const customer = typeof s.customer === "string" ? s.customer : s.customer?.id ?? null;
        let plusUntil: Date | null = null;
        if (s.mode === "subscription" && s.subscription) {
          const sub = await client.subscriptions.retrieve(typeof s.subscription === "string" ? s.subscription : s.subscription.id);
          plusUntil = periodEnd(sub);
        }
        await apply({ user, product, credits: PRODUCTS[product].credits, plusUntil, amount: s.amount_total, currency: s.currency, customer });
        break;
      }
      // Renewals, plan changes, cancellations and failed payments all arrive here.
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const user = sub.metadata?.user_id;
        if (!user) break;
        const active = event.type === "customer.subscription.updated" && ["active", "trialing", "past_due"].includes(sub.status);
        const plusUntil = active ? periodEnd(sub) : new Date();
        await apply({ user, product: sub.metadata?.product ?? "plus", plusUntil });
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("billing-webhook", event.type, error);
    return new Response("retry", { status: 500 }); // Stripe will retry
  }
  return ok();
});
