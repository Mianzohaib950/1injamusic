import { desc } from "drizzle-orm";
import { getDb, products } from "@/lib/server/db";
import { requireAdmin, requireAuth } from "@/lib/server/auth";
import { apiError, json, readJson } from "@/lib/server/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof Response) return auth;

  const adminError = requireAdmin(auth);
  if (adminError) return adminError;

  const items = await getDb().select().from(products).orderBy(desc(products.createdAt));
  return json(items);
}

export async function POST(request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof Response) return auth;

  const adminError = requireAdmin(auth);
  if (adminError) return adminError;

  const body = await readJson(request);
  const { id, name, artist, artistSlug, category, price, originalPrice, image, imageHover, description, badge, inStock, sizes } = body;
  if (!id || !name || !artist || !artistSlug || !category || price == null || !image || !imageHover || !description || !sizes) {
    return apiError("Missing required product fields", 400);
  }

  const item = {
    id,
    name,
    artist,
    artistSlug,
    category,
    price: Number(price),
    originalPrice: originalPrice === null ? null : Number(originalPrice),
    image,
    imageHover,
    description,
    badge: badge ?? null,
    inStock: Boolean(inStock),
    sizes,
  };
  await getDb().insert(products).values(item as any);
  return json(item, { status: 201 });
}
