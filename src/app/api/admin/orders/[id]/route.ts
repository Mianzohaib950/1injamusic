import { eq } from "drizzle-orm";
import { getDb, orderItems, orders, users } from "@/lib/server/db";
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
    const [customer] = await db.select().from(users).where(eq(users.id, order.userId));

    return json({
      ...order,
      customer: customer
        ? {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            role: customer.role,
            createdAt: customer.createdAt,
          }
        : null,
      items,
    });
  } catch (error) {
    return serverError(error);
  }
}
