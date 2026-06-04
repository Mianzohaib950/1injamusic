import { eq } from "drizzle-orm";
import { getDb, orderItems, orders } from "@/lib/server/db";
import { requireAdminAuth } from "@/lib/server/admin";
import { apiError, json, serverError } from "@/lib/server/http";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAdminAuth(request);
    if (auth instanceof Response) return auth;

    const { id } = await context.params;
    const db = getDb();
    const result = await db.select().from(orders).where(eq(orders.id, id));
    const order = result[0];
    if (!order) return apiError("Order not found", 404);

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    return json({ ...order, items });
  } catch (error) {
    return serverError(error);
  }
}
