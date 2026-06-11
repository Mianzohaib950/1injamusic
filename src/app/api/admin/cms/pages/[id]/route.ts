import { eq, inArray } from "drizzle-orm";
import { cmsPages, cmsSectionItems, cmsSections, getDb } from "@/lib/server/db";
import { requireAdminAuth } from "@/lib/server/admin";
import { apiError, json, noContent, readJson, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";

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
    const patch = {
      title: body.title == null ? undefined : String(body.title).trim(),
      active: body.active == null ? undefined : Boolean(body.active),
      updatedAt: new Date(),
    };

    const db = getDb();
    await db.update(cmsPages).set(patch).where(eq(cmsPages.id, id));
    const [updated] = await db.select().from(cmsPages).where(eq(cmsPages.id, id));
    if (!updated) return apiError("Page not found", 404);
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
    const [page] = await db.select().from(cmsPages).where(eq(cmsPages.id, id));
    if (!page) return apiError("Page not found", 404);

    const protectedPages = new Set(["home", "artists", "shop", "events", "booking"]);
    if (protectedPages.has(page.pageKey)) {
      return apiError(`Cannot delete protected page: ${page.pageKey}`, 400);
    }
    const sectionRows = await db
      .select({ id: cmsSections.id })
      .from(cmsSections)
      .where(eq(cmsSections.pageId, id));
    const sectionIds = sectionRows.map((section: { id: string }) => section.id);
    if (sectionIds.length > 0) {
      await db.delete(cmsSectionItems).where(inArray(cmsSectionItems.sectionId, sectionIds));
      await db.delete(cmsSections).where(eq(cmsSections.pageId, id));
    }
    await db.delete(cmsPages).where(eq(cmsPages.id, id));
    return noContent();
  } catch (error) {
    return serverError(error);
  }
}
