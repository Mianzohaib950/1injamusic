import { eq } from "drizzle-orm";
import { getDb, products } from "@/lib/server/db";
import { requireAdmin, requireAuth } from "@/lib/server/auth";
import { apiError, json, noContent, readJson } from "@/lib/server/http";

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
  const { name, artist, artistSlug, category, price, originalPrice, image, imageHover, description, badge, inStock, sizes } = await readJson(request);
  const db = getDb();
  await db
    .update(products)
    .set({
      name,
      artist,
      artistSlug,
      category,
      price: price == null ? undefined : Number(price),
      originalPrice: originalPrice == null ? null : Number(originalPrice),
      image,
      imageHover,
      description,
      badge: badge ?? null,
      inStock: inStock == null ? undefined : Boolean(inStock),
      sizes,
    } as any)
    .where(eq(products.id, id));

  const updated = await db.select().from(products).where(eq(products.id, id));
  if (updated.length === 0) return apiError("Product not found", 404);
  return json(updated[0]);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (auth instanceof Response) return auth;

  const adminError = requireAdmin(auth);
  if (adminError) return adminError;

  const { id } = await context.params;
  await getDb().delete(products).where(eq(products.id, id));
  return noContent();
}
