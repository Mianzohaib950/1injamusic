import { desc } from "drizzle-orm";
import { getDb, products } from "@/lib/server/db";
import { requireAdmin, requireAuth } from "@/lib/server/auth";
import { apiError, json, readJson, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";
import { uploadImageIfNeeded } from "@/lib/server/supabaseStorage";

export const runtime = "nodejs";

function slugify(value: string) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;

    const adminError = requireAdmin(auth);
    if (adminError) return adminError;
    await ensureServerSchema();

    const items = await getDb().select().from(products).orderBy(desc(products.createdAt));
    return json(items);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;

    const adminError = requireAdmin(auth);
    if (adminError) return adminError;
    await ensureServerSchema();

    const body = await readJson(request);
    const { id, name, artist, artistSlug, category, price, originalPrice, image, imageHover, description, badge, inStock, sizes } = body;
    if (!name || !artist || !artistSlug || !category || price == null || !image || !description) {
      return apiError("Missing required product fields", 400);
    }

    const resolvedImage = await uploadImageIfNeeded(image, "products/main");
    const resolvedImageHover = imageHover && imageHover !== image
      ? await uploadImageIfNeeded(imageHover, "products/hover")
      : resolvedImage;

    const resolvedId = String(id || slugify(name) || `product-${Date.now()}`);

    const item = {
      id: resolvedId,
      name,
      artist,
      artistSlug,
      category,
      price: Number(price),
      originalPrice: originalPrice == null ? null : Number(originalPrice),
      image: resolvedImage,
      imageHover: resolvedImageHover,
      description,
      badge: badge ?? null,
      inStock: inStock == null ? true : Boolean(inStock),
      sizes: Array.isArray(sizes) && sizes.length > 0 ? sizes : ["One Size"],
    };
    await getDb().insert(products).values(item);
    return json(item, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
