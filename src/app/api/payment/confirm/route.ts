import { eq } from "drizzle-orm";
import { getDb, orderItems, orders, products } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/auth";
import { apiError, json, readJson, serverError } from "@/lib/server/http";
import { getStripe } from "@/lib/server/stripe";

export const runtime = "nodejs";

type Product = typeof products.$inferSelect;

function normalizeStockBySize(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {} as Record<string, number>;
  return Object.fromEntries(
    Object.entries(value).map(([size, quantity]) => [
      String(size),
      Math.max(0, Math.floor(Number(quantity) || 0)),
    ]),
  ) as Record<string, number>;
}

function getFallbackLowStock(product: Product, size: string) {
  if (!product.inStock || size.toLowerCase() === "one size") return null;

  const badge = product.badge?.toUpperCase();
  if (badge === "SALE" && ["L", "XL", "XXL"].includes(size)) return size === "XXL" ? 1 : 2;
  if (badge === "LIMITED" && ["M", "L", "XL", "XXL"].includes(size)) return size === "XXL" ? 2 : 3;
  if (/limited|exclusive|drop|edition/i.test(product.name) && ["XL", "XXL"].includes(size)) return 3;

  return null;
}

function getAvailableStock(product: Product, size: string, stockBySize: Record<string, number>) {
  return stockBySize[size] ?? getFallbackLowStock(product, size);
}

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

    if (order.stockAdjusted) {
      return json({ success: true });
    }

    const items = (await db.select().from(orderItems).where(eq(orderItems.orderId, orderId))) as typeof orderItems.$inferSelect[];
    for (const item of items) {
      const productRows = await db.select().from(products).where(eq(products.id, item.productId));
      const product = productRows[0];
      if (!product) continue;

      const size = String(item.size || "One Size");
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const stockBySize = normalizeStockBySize(product.stockBySize);
      const availableStock = getAvailableStock(product, size, stockBySize);

      if (availableStock == null) continue;
      if (availableStock < quantity) {
        return apiError(`Not enough stock left for ${product.name} (${size}).`, 400);
      }

      stockBySize[size] = availableStock - quantity;

      await db
        .update(products)
        .set({
          stockBySize,
        })
        .where(eq(products.id, product.id));
    }

    await db.update(orders).set({ status: "Processing", stockAdjusted: true }).where(eq(orders.id, orderId));
    return json({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
