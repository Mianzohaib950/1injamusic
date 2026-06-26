import { eq } from "drizzle-orm";
import { getDb, artists } from "@/lib/server/db";
import { requireAdminAuth } from "@/lib/server/admin";
import { apiError, json, noContent, readJson, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";
import { uploadImageIfNeeded } from "@/lib/server/supabaseStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const auth = requireAdminAuth(request);
    if (auth instanceof Response) return auth;
    await ensureServerSchema();

    const { slug } = await context.params;
    const result = await getDb().select().from(artists).where(eq(artists.slug, slug));
    if (result.length === 0) return apiError("Artist not found", 404);
    return json(result[0], { headers: { "Cache-Control": "no-store" } });
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
    const body = await readJson(request);
    const resolvedImage = body.image == null ? undefined : await uploadImageIfNeeded(body.image, "artists/profile");
    const patch = {
      name: body.name,
      genres: Array.isArray(body.genres) ? body.genres : undefined,
      bio: body.bio,
      image: resolvedImage,
      bookingEmail: body.bookingEmail,
      active: body.active == null ? undefined : Boolean(body.active),
      sortOrder: body.sortOrder == null ? undefined : Number(body.sortOrder),
      updatedAt: new Date(),
    };

    const db = getDb();
    await db.update(artists).set(patch).where(eq(artists.slug, slug));
    const updated = await db.select().from(artists).where(eq(artists.slug, slug));
    if (updated.length === 0) return apiError("Artist not found", 404);
    return json(updated[0], { headers: { "Cache-Control": "no-store" } });
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
    await getDb().delete(artists).where(eq(artists.slug, slug));
    return noContent();
  } catch (error) {
    return serverError(error);
  }
}
