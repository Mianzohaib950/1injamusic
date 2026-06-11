import { eq } from "drizzle-orm";
import { cmsSectionItems, cmsSections, getDb } from "@/lib/server/db";
import { requireAdminAuth } from "@/lib/server/admin";
import { apiError, json, noContent, readJson, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";
import { uploadImageIfNeeded } from "@/lib/server/supabaseStorage";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAdminAuth(request);
    if (auth instanceof Response) return auth;
    await ensureServerSchema();

    const { id } = await context.params;
    const body = await readJson(request);
    const resolvedImageUrl = body.imageUrl == null ? undefined : await uploadImageIfNeeded(body.imageUrl, "cms/sections");
    const patch = {
      sectionKey: body.sectionKey == null ? undefined : String(body.sectionKey).trim(),
      sectionType: body.sectionType == null ? undefined : String(body.sectionType).trim(),
      title: body.title == null ? undefined : String(body.title),
      subtitle: body.subtitle == null ? undefined : String(body.subtitle),
      body: body.body == null ? undefined : String(body.body),
      imageUrl: resolvedImageUrl,
      videoUrl: body.videoUrl == null ? undefined : String(body.videoUrl),
      ctaLabel: body.ctaLabel == null ? undefined : String(body.ctaLabel),
      ctaUrl: body.ctaUrl == null ? undefined : String(body.ctaUrl),
      settings: body.settings == null ? undefined : body.settings,
      sortOrder: body.sortOrder == null ? undefined : Number(body.sortOrder),
      active: body.active == null ? undefined : Boolean(body.active),
      updatedAt: new Date(),
    };

    const db = getDb();
    await db.update(cmsSections).set(patch).where(eq(cmsSections.id, id));
    const [updated] = await db.select().from(cmsSections).where(eq(cmsSections.id, id));
    if (!updated) return apiError("Section not found", 404);
    return json(updated);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAdminAuth(request);
    if (auth instanceof Response) return auth;
    await ensureServerSchema();

    const { id } = await context.params;
    const db = getDb();
    await db.delete(cmsSectionItems).where(eq(cmsSectionItems.sectionId, id));
    await db.delete(cmsSections).where(eq(cmsSections.id, id));
    return noContent();
  } catch (error) {
    return serverError(error);
  }
}
