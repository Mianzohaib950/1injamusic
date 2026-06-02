import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { getDb, orders } from "@/lib/server/db";
import { getStripe, getStripeWebhookSecret } from "@/lib/server/stripe";
import { json } from "@/lib/server/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing Stripe signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = getStripe().webhooks.constructEvent(rawBody, signature, getStripeWebhookSecret());
  } catch (error) {
    return new Response(`Webhook signature verification failed: ${error}`, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata.orderId as string | undefined;
    if (orderId) {
      await getDb().update(orders).set({ status: "Processing" }).where(eq(orders.id, orderId));
    }
  }

  return json({ received: true });
}
