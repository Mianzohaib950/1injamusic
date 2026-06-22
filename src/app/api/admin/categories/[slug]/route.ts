import { eq } from "drizzle-orm";
import { getDb, categories, products } from "@/lib/server/db";
import { requireAdminAuth } from "@/lib/server/admin";
import { apiError, json, noContent, readJson, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";

export const runtime = "nodejs";

function slugify(value: string) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const auth = requireAdminAuth(request);
    if (auth instanceof Response) return auth;
    await ensureServerSchema();

    const { slug } = await context.params;
    const result = await getDb().select().from(categories).where(eq(categories.slug, slug));
    if (result.length === 0) return apiError("Category not found", 404);
    return json(result[0]);
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const auth = requireAdminAuth(request);
    if (auth instanceof Response) return auth;
    await ensureServerSchema();

    const { slug } = await context.params;
    const body = await readJson<any>(request);
    const incomingSlug = String(body.slug ?? "").trim();
    const nextSlug = incomingSlug ? slugify(incomingSlug) : undefined;
    const nextName = body.name == null ? undefined : String(body.name).trim();
    if (nextName !== undefined && !nextName) {
      return apiError("Category name is required", 400);
    }

    const db = getDb();

    if (nextSlug && nextSlug !== slug) {
      await db
        .update(products)
        .set({ category: nextSlug })
        .where(eq(products.category, slug));
    }

    await db
      .update(categories)
      .set({
        slug: nextSlug,
        name: nextName,
        active: body.active == null ? undefined : Boolean(body.active),
        sortOrder: body.sortOrder == null ? undefined : Number(body.sortOrder),
        updatedAt: new Date(),
      })
      .where(eq(categories.slug, slug));

    const updated = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, nextSlug ?? slug));
    if (updated.length === 0) return apiError("Category not found", 404);
    return json(updated[0]);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const auth = requireAdminAuth(request);
    if (auth instanceof Response) return auth;
    await ensureServerSchema();

    const { slug } = await context.params;
    const linkedProducts = await getDb()
      .select({ id: products.id })
      .from(products)
      .where(eq(products.category, slug))
      .limit(1);
    if (linkedProducts.length > 0) {
      return apiError("Cannot delete category while products use it", 400);
    }

    await getDb().delete(categories).where(eq(categories.slug, slug));
    return noContent();
  } catch (error) {
    return serverError(error);
  }
}
