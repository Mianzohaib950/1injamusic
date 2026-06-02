import { desc, eq } from "drizzle-orm";
import { getDb, orderItems, orders } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/auth";
import { json } from "@/lib/server/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof Response) return auth;

  const db = getDb();
  const baseOrders =
    auth.role === "admin"
      ? await db.select().from(orders).orderBy(desc(orders.createdAt))
      : await db.select().from(orders).where(eq(orders.userId, auth.sub)).orderBy(desc(orders.createdAt));

  const results = await Promise.all(
    baseOrders.map(async (order: typeof orders.$inferSelect) => {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      return { ...order, items };
    }),
  );

  return json(results);
}
