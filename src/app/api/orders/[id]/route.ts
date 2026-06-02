import { eq } from "drizzle-orm";
import { getDb, orderItems, orders } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/auth";
import { apiError, json } from "@/lib/server/http";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (auth instanceof Response) return auth;

  const { id } = await context.params;
  const db = getDb();
  const result = await db.select().from(orders).where(eq(orders.id, id));
  const order = result[0];
  if (!order) return apiError("Order not found", 404);
  if (auth.role !== "admin" && order.userId !== auth.sub) {
    return apiError("Access denied", 403);
  }

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  return json({ ...order, items });
}
