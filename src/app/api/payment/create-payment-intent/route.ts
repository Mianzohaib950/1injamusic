import { randomUUID } from "crypto";
import { inArray } from "drizzle-orm";
import { getDb, orderItems, orders, products } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/auth";
import { apiError, json, readJson } from "@/lib/server/http";
import { getStripe } from "@/lib/server/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof Response) return auth;

  const { items, shippingAddress } = await readJson(request);
  if (!Array.isArray(items) || items.length === 0) {
    return apiError("Cart items are required", 400);
  }

  const requiredKeys = ["firstName", "lastName", "address", "city", "zip", "country"];
  if (!shippingAddress || requiredKeys.some((key) => !shippingAddress[key])) {
    return apiError("Valid shipping address is required", 400);
  }

  const db = getDb();
  const productIds = [...new Set(items.map((item: any) => item.productId))];
  const dbProducts = await db.select().from(products).where(inArray(products.id, productIds));

  if (dbProducts.length !== productIds.length) {
    return apiError("Some cart items are invalid", 400);
  }

  const lineItems = items.map((item: any) => {
    const product = dbProducts.find((p: typeof products.$inferSelect) => p.id === item.productId);
    if (!product) throw new Error("Invalid cart item");
    const quantity = Number(item.quantity) || 1;
    return {
      productId: product.id,
      name: product.name,
      artist: product.artist,
      image: product.image,
      size: item.size || "One Size",
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

  const paymentIntent = await getStripe().paymentIntents.create({
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
    stripePaymentIntentId: paymentIntent.id,
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

  return json({ clientSecret: paymentIntent.client_secret, orderId });
}
