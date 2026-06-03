import { eq } from "drizzle-orm";
import { getDb, orders } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/auth";
import { apiError, json, readJson, serverError } from "@/lib/server/http";
import { getStripe } from "@/lib/server/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;

    const { paymentIntentId, orderId, demoPayment } = await readJson(request);
    if (!orderId || (!paymentIntentId && !demoPayment)) {
      return apiError("Missing paymentIntentId or orderId", 400);
    }

    const db = getDb();
    const result = await db.select().from(orders).where(eq(orders.id, orderId));
    const order = result[0];
    if (!order) return apiError("Order not found", 404);
    if (order.userId !== auth.sub && auth.role !== "admin") {
      return apiError("Access denied", 403);
    }

    if (!demoPayment) {
      const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== "succeeded") {
        return apiError("Payment has not succeeded yet", 400);
      }
    }

    await db.update(orders).set({ status: "Processing" }).where(eq(orders.id, orderId));
    return json({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
