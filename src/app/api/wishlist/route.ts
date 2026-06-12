import { randomUUID } from "crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb, products, wishlists } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/auth";
import { apiError, json, readJson, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    await ensureServerSchema();

    const db = getDb();
    const rows = await db
      .select()
      .from(wishlists)
      .where(eq(wishlists.userId, auth.sub))
      .orderBy(desc(wishlists.createdAt));

    const productIds = rows.map((row: typeof wishlists.$inferSelect) => row.productId);
    const productRows =
      productIds.length > 0
        ? await db.select().from(products).where(inArray(products.id, productIds))
        : [];
    const productMap = new Map(
      productRows.map((row: typeof products.$inferSelect) => [row.id, row]),
    );

    return json(
      rows.map((row: typeof wishlists.$inferSelect) => ({
        ...row,
        product: productMap.get(row.productId) ?? null,
      })),
    );
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    await ensureServerSchema();

    const body = await readJson<{ productId?: string }>(request);
    const productId = String(body.productId ?? "").trim();
    if (!productId) return apiError("Product ID is required", 400);

    const db = getDb();
    const [product] = await db.select().from(products).where(eq(products.id, productId));
    if (!product) return apiError("Product not found", 404);

    const [existing] = await db
      .select()
      .from(wishlists)
      .where(and(eq(wishlists.userId, auth.sub), eq(wishlists.productId, productId)));

    if (existing) {
      return json({ ...existing, product });
    }

    const row = {
      id: randomUUID(),
      userId: auth.sub,
      productId,
      createdAt: new Date(),
    };
    await db.insert(wishlists).values(row);
    return json({ ...row, product }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
