import { desc, eq } from "drizzle-orm";
import { getDb, orderItems, orders } from "@/lib/server/db";
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
    orderRows.map(async (order: typeof orders.$inferSelect) => ({
      ...order,
      items: await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    })),
  );
  return json(payload);
}
