import { desc } from "drizzle-orm";
import { getDb, orderItems, orders, users } from "@/lib/server/db";
import { requireAdmin, requireAuth } from "@/lib/server/auth";
import { json, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";
import { withDatabaseRetry } from "@/lib/server/dbRetry";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;

    const adminError = requireAdmin(auth);
    if (adminError) return adminError;

    const [orderRows, itemRows, userRows] = await withDatabaseRetry(async () => {
      await ensureServerSchema();

      const db = getDb();
      const orderRows = await db.select().from(orders).orderBy(desc(orders.createdAt));
      const itemRows = await db.select().from(orderItems);
      const userRows = await db.select().from(users);

      return [orderRows, itemRows, userRows];
    });
    const itemsByOrderId = new Map<string, Array<typeof orderItems.$inferSelect>>();
    itemRows.forEach((item: typeof orderItems.$inferSelect) => {
      const current = itemsByOrderId.get(item.orderId) ?? [];
      current.push(item);
      itemsByOrderId.set(item.orderId, current);
    });
    const usersById = new Map<string, typeof users.$inferSelect>(
      userRows.map((user: typeof users.$inferSelect) => [user.id, user]),
    );
    const payload = orderRows.map((order: typeof orders.$inferSelect) => {
      const items = itemsByOrderId.get(order.id) ?? [];
      const customer = usersById.get(order.userId);
      return {
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
      };
    });
    return json(payload);
  } catch (error) {
    return serverError(error);
  }
}
