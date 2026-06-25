import { randomUUID } from "crypto";
import { inArray } from "drizzle-orm";
import { getDb, orderItems, orders, products } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/auth";
import { apiError, json, readJson, serverError } from "@/lib/server/http";
import { getStripe } from "@/lib/server/stripe";
import { ensureServerSchema } from "@/lib/server/schemaSync";

export const runtime = "nodejs";

type Db = ReturnType<typeof getDb>;
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

function getAvailableStock(product: Product, size: string) {
  const stockBySize = normalizeStockBySize(product.stockBySize);
  return stockBySize[size] ?? getFallbackLowStock(product, size);
}

function resolveCartProductId(item: any) {
  const candidates = [
    item?.productId,
    item?.id,
    typeof item?.cartKey === "string" ? item.cartKey.split("::")[0] : undefined,
  ].filter((id): id is string => typeof id === "string" && id.length > 0);

  return candidates[0] ?? null;
}

async function getCartProducts(db: Db, productIds: string[]) {
  return db.select().from(products).where(inArray(products.id, productIds));
}

export async function POST(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    await ensureServerSchema();

    const { items, shippingAddress } = await readJson(request);
    if (!Array.isArray(items) || items.length === 0) {
      return apiError("Cart items are required", 400);
    }

    const requiredKeys = ["firstName", "lastName", "address", "city", "zip", "country"];
    if (!shippingAddress || requiredKeys.some((key) => !shippingAddress[key])) {
      return apiError("Valid shipping address is required", 400);
    }

    const db = getDb();
    const cartItems = items.map((item: any) => ({
      ...item,
      productId: resolveCartProductId(item),
    }));
    const invalidInputItem = cartItems.find((item: any) => !item.productId);
    if (invalidInputItem) {
      return apiError(`Cart item "${invalidInputItem.name ?? "Unknown item"}" is missing a product ID. Please remove it and add it again.`, 400);
    }

    const productIds = [...new Set(cartItems.map((item: any) => item.productId as string))];
    const dbProducts = await getCartProducts(db, productIds);

    if (dbProducts.length !== productIds.length) {
      const foundIds = new Set(dbProducts.map((product: Product) => product.id));
      const missingItem = cartItems.find((item: any) => !foundIds.has(item.productId));
      return apiError(`Cart item "${missingItem?.name ?? missingItem?.productId ?? "Unknown item"}" is unavailable. Please remove it and add it again.`, 400);
    }

    const lineItems = cartItems.map((item: any) => {
      const product = dbProducts.find((p: typeof products.$inferSelect) => p.id === item.productId);
      if (!product) throw new Error("Invalid cart item");
      const quantity = Number(item.quantity) || 1;
      const size = item.size || "One Size";
      const availableStock = getAvailableStock(product, size);

      if (!product.inStock) {
        throw new Error(`"${product.name}" is currently out of stock.`);
      }
      if (availableStock != null && quantity > availableStock) {
        throw new Error(`Only ${availableStock} left for ${product.name} (${size}).`);
      }

      return {
        productId: product.id,
        name: product.name,
        artist: product.artist,
        image: product.image,
        size,
        quantity,
        priceCents: product.price * 100,
        amountCents: product.price * 100 * quantity,
      };
    });

    const subtotalCents = lineItems.reduce((sum, item) => sum + item.amountCents, 0);
    const shippingCents = 1200;
    const taxCents = Math.round(subtotalCents * 0.08);
    const totalCents = subtotalCents + shippingCents + taxCents;
    const orderId = randomUUID();
    const isDemoPayment = !process.env.STRIPE_SECRET_KEY;

    const paymentIntent = isDemoPayment
      ? null
      : await getStripe().paymentIntents.create({
          amount: totalCents,
          currency: "usd",
          automatic_payment_methods: { enabled: true },
          metadata: {
            orderId,
            userId: auth.sub,
          },
          description: `1 Jamaica Music order ${orderId}`,
        });

    await db.insert(orders).values({
      id: orderId,
      userId: auth.sub,
      status: "Pending",
      subtotalCents,
      shippingCents,
      taxCents,
      totalCents,
      stripePaymentIntentId: paymentIntent?.id ?? `demo-${orderId}`,
      firstName: shippingAddress.firstName,
      lastName: shippingAddress.lastName,
      address: shippingAddress.address,
      city: shippingAddress.city,
      state: shippingAddress.state ?? "",
      zip: shippingAddress.zip,
      country: shippingAddress.country,
    });

    await Promise.all(
      lineItems.map((item) =>
        db.insert(orderItems).values({
          id: randomUUID(),
          orderId,
          productId: item.productId,
          name: item.name,
          artist: item.artist,
          price: item.priceCents,
          image: item.image,
          size: item.size,
          quantity: item.quantity,
        }),
      ),
    );

    return json({ clientSecret: paymentIntent?.client_secret ?? null, orderId, demo: isDemoPayment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/out of stock|only \d+ left/i.test(message)) {
      return apiError(message, 400);
    }
    return serverError(error);
  }
}
