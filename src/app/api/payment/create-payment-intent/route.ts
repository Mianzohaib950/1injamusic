import { randomUUID } from "crypto";
import { inArray } from "drizzle-orm";
import { getDb, orderItems, orders, products } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/auth";
import { apiError, json, readJson, serverError } from "@/lib/server/http";
import { getStripe } from "@/lib/server/stripe";
import { ensureServerSchema } from "@/lib/server/schemaSync";
import { merchProducts } from "@/data/merch";

export const runtime = "nodejs";

type Db = ReturnType<typeof getDb>;
type Product = typeof products.$inferSelect;

function getCatalogProduct(id: string) {
  return merchProducts.find((product) => product.id === id);
}

function resolveCartProductId(item: any) {
  const candidates = [
    item?.productId,
    item?.id,
    typeof item?.cartKey === "string" ? item.cartKey.split("::")[0] : undefined,
  ].filter((id): id is string => typeof id === "string" && id.length > 0);

  const productById = candidates
    .map((id) => getCatalogProduct(id))
    .find(Boolean);

  return productById?.id ?? merchProducts.find((product) => product.name === item?.name)?.id ?? candidates[0] ?? null;
}

async function getCartProducts(db: Db, productIds: string[]) {
  let dbProducts = await db.select().from(products).where(inArray(products.id, productIds));
  const foundIds = new Set(dbProducts.map((product: Product) => product.id));
  const missingCatalogProducts = productIds
    .filter((id) => !foundIds.has(id))
    .map(getCatalogProduct)
    .filter((product): product is NonNullable<ReturnType<typeof getCatalogProduct>> => Boolean(product));

  if (missingCatalogProducts.length > 0) {
    await db
      .insert(products)
      .values(
        missingCatalogProducts.map(({ sizes: _sizes, ...product }) => product),
      )
      .onConflictDoNothing();

    dbProducts = await db.select().from(products).where(inArray(products.id, productIds));
  }

  return dbProducts;
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
    return serverError(error);
  }
}
