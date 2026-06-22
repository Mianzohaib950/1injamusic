import { eq } from "drizzle-orm";
import { getDb, products } from "@/lib/server/db";
import { requireAdmin, requireAuth } from "@/lib/server/auth";
import { apiError, json, noContent, readJson, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";
import { uploadImageIfNeeded } from "@/lib/server/supabaseStorage";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;

    const adminError = requireAdmin(auth);
    if (adminError) return adminError;
    await ensureServerSchema();

    const { id } = await context.params;
    const result = await getDb().select().from(products).where(eq(products.id, id));
    if (result.length === 0) return apiError("Product not found", 404);
    return json(result[0]);
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;

    const adminError = requireAdmin(auth);
    if (adminError) return adminError;
    await ensureServerSchema();

    const { id } = await context.params;
    const { name, artist, artistSlug, category, price, originalPrice, image, imageHover, description, badge, inStock, sizes } = await readJson(request);
    const resolvedImage = image === undefined ? undefined : await uploadImageIfNeeded(image, "products/main");
    const resolvedImageHover = imageHover === undefined
      ? undefined
      : imageHover && imageHover !== image
        ? await uploadImageIfNeeded(imageHover, "products/hover")
        : resolvedImage ?? imageHover ?? image;
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
        image: resolvedImage,
        imageHover: resolvedImageHover,
        description,
        badge: badge ?? null,
        inStock: inStock == null ? undefined : Boolean(inStock),
        sizes: Array.isArray(sizes) && sizes.length > 0 ? sizes : undefined,
      })
      .where(eq(products.id, id));

    const updated = await db.select().from(products).where(eq(products.id, id));
    if (updated.length === 0) return apiError("Product not found", 404);
    return json(updated[0]);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;

    const adminError = requireAdmin(auth);
    if (adminError) return adminError;
    await ensureServerSchema();

    const { id } = await context.params;
    await getDb().delete(products).where(eq(products.id, id));
    return noContent();
  } catch (error) {
    return serverError(error);
  }
}
