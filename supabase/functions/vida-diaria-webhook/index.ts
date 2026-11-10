// «Inglés para el día a día»: destino de webhook PROPIO del curso en Stripe, separado de VUM Academy
// (/api/academy/webhook), de las membresías (/api/membership/webhook) y de billing-webhook (créditos de BritJoy).
// Se despliega SIN verificación JWT (Stripe no envía token de Supabase). Cada petición debe llevar la firma de Stripe
// de ESTE destino (secreto STRIPE_WEBHOOK_SECRET_VIDA_DIARIA). Solo escribe course_access; nunca plus_until ni créditos.
// Precios: STRIPE_PRICE_VIDA_DIARIA (curso £12) y STRIPE_PRICE_VIDA_DIARIA_ORIENTACION (orientación £8), IVA incluido.
// Eventos que debe enviar el destino (y nada más): VD_WEBHOOK_EVENTS =
//   customer.subscription.created · customer.subscription.updated · customer.subscription.deleted · invoice.paid ·
//   invoice_payment.paid · charge.refunded · charge.dispute.created · charge.dispute.updated · charge.dispute.closed ·
//   radar.early_fraud_warning.created
// Los cargos, disputas y enlaces de pago de OTROS productos de la cuenta también llegan aquí: solo se guardan sus IDs
// y no cambian nada, porque únicamente cuentan si enlazan con una factura de este curso.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { admin } from "../_shared/http.ts";
import { Stripe, stripe } from "../_shared/stripe.ts";
import { accessChangeFromEvent, paymentFromEvent, paymentLinkFromEvent, reversalFromEvent, vdPrices } from "../_shared/vida-diaria.ts";

const cryptoProvider = Stripe.createSubtleCryptoProvider();
const ok = () => new Response("ok", { status: 200 });

Deno.serve(async (req: Request) => {
  const client = stripe();
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET_VIDA_DIARIA");
  if (!client || !secret) return new Response("not configured", { status: 503 });

  let event: Stripe.Event;
  try {
    event = await client.webhooks.constructEventAsync(await req.text(), req.headers.get("stripe-signature") ?? "", secret, undefined, cryptoProvider);
  } catch {
    return new Response("bad signature", { status: 400 });
  }

  const db = admin();
  const prices = vdPrices(Deno.env.get("STRIPE_PRICE_VIDA_DIARIA"), Deno.env.get("STRIPE_PRICE_VIDA_DIARIA_ORIENTACION"));
  try {
    // Pago efectivo de una factura del curso: fija hasta cuándo está pagado (el acceso no pasa de ahí).
    const paid = paymentFromEvent(event, prices);
    if (paid) {
      const { error } = await db.rpc("apply_course_payment", {
        p_event: paid.event, p_user: paid.user, p_product: paid.product, p_paid_until: paid.paidUntil, p_subscription: paid.subscription,
        p_invoice: paid.invoice, p_orientation_until: paid.orientationUntil,
      });
      if (error) throw error;
      return ok();
    }
    // Qué PaymentIntent o cargo pagó cada factura (para poder localizar después su reembolso o disputa).
    const link = paymentLinkFromEvent(event);
    if (link) {
      const { error } = await db.rpc("apply_course_payment_link", { p_event: link.event, p_invoice: link.invoice, p_refs: link.refs });
      if (error) throw error;
      return ok();
    }
    // Reembolso completo o disputa: solo deja de contar la factura de ese pago.
    const reversal = reversalFromEvent(event);
    if (reversal) {
      const { error } = await db.rpc("apply_course_reversal", {
        p_event: reversal.event, p_event_created: reversal.created, p_source: reversal.source, p_kind: reversal.kind,
        p_refs: reversal.refs, p_active: reversal.active, p_terminal: reversal.terminal,
      });
      if (error) throw error;
      return ok();
    }
    // Alta, renovación, cancelación o baja de la suscripción del curso (precio y metadata del curso).
    const change = accessChangeFromEvent(event, prices);
    if (change) {
      const { error } = await db.rpc("apply_course_access", {
        p_event: change.event, p_event_created: change.eventCreated, p_user: change.user, p_product: change.product,
        p_status: change.status, p_access_until: change.accessUntil, p_cancel: change.cancelAtPeriodEnd,
        p_subscription: change.subscription, p_customer: change.customer, p_orientation: change.orientation,
      });
      if (error) throw error;
    }
    // Cualquier otro evento (otro precio, otro producto) no abre nada.
    return ok();
  } catch (error) {
    console.error("vida-diaria-webhook", event.type, error);
    return new Response("retry", { status: 500 }); // Stripe reintenta
  }
});
