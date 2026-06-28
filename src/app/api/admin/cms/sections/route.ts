import { asc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { cmsPages, cmsSectionItems, cmsSections, getDb } from "@/lib/server/db";
import { requireAdminAuth } from "@/lib/server/admin";
import { apiError, json, readJson, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";
import { uploadImageIfNeeded } from "@/lib/server/supabaseStorage";
import { withDatabaseRetry } from "@/lib/server/dbRetry";

export const runtime = "nodejs";

function sectionPayload(body: any) {
  return {
    pageId: body.pageId ? String(body.pageId).trim() : "",
    sectionKey: String(body.sectionKey ?? "").trim(),
    sectionType: String(body.sectionType ?? "content").trim(),
    title: String(body.title ?? "").trim(),
    subtitle: String(body.subtitle ?? "").trim(),
    body: String(body.body ?? "").trim(),
    imageUrl: String(body.imageUrl ?? "").trim(),
    videoUrl: String(body.videoUrl ?? "").trim(),
    ctaLabel: String(body.ctaLabel ?? "").trim(),
    ctaUrl: String(body.ctaUrl ?? "").trim(),
    settings: typeof body.settings === "object" && body.settings ? body.settings : {},
    sortOrder: Number(body.sortOrder ?? 0),
    active: body.active == null ? true : Boolean(body.active),
  };
}

export async function GET(request: Request) {
  try {
    const auth = requireAdminAuth(request);
    if (auth instanceof Response) return auth;

    const pageKey = new URL(request.url).searchParams.get("pageKey")?.trim() || "home";
    const result = await withDatabaseRetry(async () => {
      await ensureServerSchema();
      const db = getDb();
      const [page] = await db.select().from(cmsPages).where(eq(cmsPages.pageKey, pageKey));
      if (!page) return null;
      const pageId = page.id;
      const sections = await db.select().from(cmsSections).where(eq(cmsSections.pageId, pageId)).orderBy(asc(cmsSections.sortOrder));
      const payload = [];
      for (const section of sections) {
        const items = await db.select().from(cmsSectionItems).where(eq(cmsSectionItems.sectionId, section.id)).orderBy(asc(cmsSectionItems.sortOrder));
        payload.push({ ...section, items });
      }
      return payload;
    });
    if (!result) return apiError(`CMS page not found: ${pageKey}`, 404);
    return json(result);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireAdminAuth(request);
    if (auth instanceof Response) return auth;
    await ensureServerSchema();

    const body = await readJson(request);
    const payload = sectionPayload(body);
    payload.imageUrl = String(await uploadImageIfNeeded(payload.imageUrl, "cms/sections"));
    if (!payload.sectionKey) return apiError("sectionKey is required", 400);
    const db = getDb();

    const pageKey = String(body.pageKey ?? "home").trim();
    if (!payload.pageId) {
      const [page] = await db.select().from(cmsPages).where(eq(cmsPages.pageKey, pageKey));
      if (!page) return apiError(`CMS page not found: ${pageKey}`, 404);
      payload.pageId = page.id;
    }

    const id = String(body.id ?? randomUUID());
    const row = { id, ...payload, updatedAt: new Date() };
    await db.insert(cmsSections).values(row);
    return json(row, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
