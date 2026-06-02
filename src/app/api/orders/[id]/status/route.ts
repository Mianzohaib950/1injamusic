import { eq } from "drizzle-orm";
import { getDb, orders } from "@/lib/server/db";
import { requireAdmin, requireAuth } from "@/lib/server/auth";
import { apiError, json, readJson } from "@/lib/server/http";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (auth instanceof Response) return auth;

  const adminError = requireAdmin(auth);
  if (adminError) return adminError;

  const { id } = await context.params;
  const { status } = await readJson(request);
  const allowedStatuses = ["Processing", "Shipped", "Delivered", "Pending"];
  if (!allowedStatuses.includes(status)) {
    return apiError("Invalid order status", 400);
  }

  const db = getDb();
  const result = await db.select().from(orders).where(eq(orders.id, id));
  if (result.length === 0) return apiError("Order not found", 404);

  await db.update(orders).set({ status }).where(eq(orders.id, id));
  const updated = await db.select().from(orders).where(eq(orders.id, id));
  return json(updated[0]);
}
