import { asc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { cmsSectionItems, getDb } from "@/lib/server/db";
import { requireAdminAuth } from "@/lib/server/admin";
import { apiError, json, readJson, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";
import { uploadImageIfNeeded } from "@/lib/server/supabaseStorage";
import { withDatabaseRetry } from "@/lib/server/dbRetry";

export const runtime = "nodejs";

function itemPayload(body: any, sectionId: string) {
  return {
    sectionId,
    itemKey: String(body.itemKey ?? "").trim(),
    title: String(body.title ?? "").trim(),
    subtitle: String(body.subtitle ?? "").trim(),
    description: String(body.description ?? "").trim(),
    imageUrl: String(body.imageUrl ?? "").trim(),
    videoUrl: String(body.videoUrl ?? "").trim(),
    linkLabel: String(body.linkLabel ?? "").trim(),
    linkUrl: String(body.linkUrl ?? "").trim(),
    tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
    meta: typeof body.meta === "object" && body.meta ? body.meta : {},
    sortOrder: Number(body.sortOrder ?? 0),
    active: body.active == null ? true : Boolean(body.active),
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAdminAuth(request);
    if (auth instanceof Response) return auth;

    const { id } = await context.params;
    const items = await withDatabaseRetry(async () => {
      await ensureServerSchema();
      return getDb().select().from(cmsSectionItems).where(eq(cmsSectionItems.sectionId, id)).orderBy(asc(cmsSectionItems.sortOrder));
    });
    return json(items);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAdminAuth(request);
    if (auth instanceof Response) return auth;

    const { id } = await context.params;
    const body = await readJson(request);
    const payload = itemPayload(body, id);
    payload.imageUrl = String(await uploadImageIfNeeded(payload.imageUrl, "cms/items"));
    const itemId = String(body.id ?? randomUUID());
    const row = { id: itemId, ...payload, updatedAt: new Date() };
    await withDatabaseRetry(async () => {
      await ensureServerSchema();
      await getDb().insert(cmsSectionItems).values(row);
    });
    return json(row, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
