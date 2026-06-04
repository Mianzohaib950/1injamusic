import { desc, eq } from "drizzle-orm";
import { getDb, orderItems, orders, users } from "@/lib/server/db";
import { requireAdmin, requireAuth } from "@/lib/server/auth";
import { json } from "@/lib/server/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof Response) return auth;

  const adminError = requireAdmin(auth);
  if (adminError) return adminError;

  const db = getDb();
  const orderRows = await db.select().from(orders).orderBy(desc(orders.createdAt));
  const payload = await Promise.all(
    orderRows.map(async (order: typeof orders.$inferSelect) => {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      const [customer] = await db.select().from(users).where(eq(users.id, order.userId));
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
    }),
  );
  return json(payload);
}
