import { eq } from "drizzle-orm";
import { cmsPages, getDb } from "@/lib/server/db";
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
    await db.delete(cmsPages).where(eq(cmsPages.id, id));
    return noContent();
  } catch (error) {
    return serverError(error);
  }
}
