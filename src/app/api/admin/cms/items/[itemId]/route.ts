import { eq } from "drizzle-orm";
import { cmsSectionItems, getDb } from "@/lib/server/db";
import { requireAdminAuth } from "@/lib/server/admin";
import { apiError, json, noContent, readJson, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";
import { uploadImageIfNeeded } from "@/lib/server/supabaseStorage";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  context: { params: Promise<{ itemId: string }> },
) {
  try {
    const auth = requireAdminAuth(request);
    if (auth instanceof Response) return auth;
    await ensureServerSchema();

    const { itemId } = await context.params;
    const body = await readJson(request);
    const resolvedImageUrl = body.imageUrl == null ? undefined : await uploadImageIfNeeded(body.imageUrl, "cms/items");
    const patch = {
      itemKey: body.itemKey == null ? undefined : String(body.itemKey).trim(),
      title: body.title == null ? undefined : String(body.title),
      subtitle: body.subtitle == null ? undefined : String(body.subtitle),
      description: body.description == null ? undefined : String(body.description),
      imageUrl: resolvedImageUrl,
      videoUrl: body.videoUrl == null ? undefined : String(body.videoUrl),
      linkLabel: body.linkLabel == null ? undefined : String(body.linkLabel),
      linkUrl: body.linkUrl == null ? undefined : String(body.linkUrl),
      tags: body.tags == null ? undefined : (Array.isArray(body.tags) ? body.tags.map(String) : []),
      meta: body.meta == null ? undefined : body.meta,
      sortOrder: body.sortOrder == null ? undefined : Number(body.sortOrder),
      active: body.active == null ? undefined : Boolean(body.active),
      updatedAt: new Date(),
    };

    const db = getDb();
    await db.update(cmsSectionItems).set(patch).where(eq(cmsSectionItems.id, itemId));
    const [updated] = await db.select().from(cmsSectionItems).where(eq(cmsSectionItems.id, itemId));
    if (!updated) return apiError("Item not found", 404);
    return json(updated);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ itemId: string }> },
) {
  try {
    const auth = requireAdminAuth(request);
    if (auth instanceof Response) return auth;
    await ensureServerSchema();

    const { itemId } = await context.params;
    await getDb().delete(cmsSectionItems).where(eq(cmsSectionItems.id, itemId));
    return noContent();
  } catch (error) {
    return serverError(error);
  }
}
