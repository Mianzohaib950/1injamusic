import { asc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { cmsPages, getDb } from "@/lib/server/db";
import { requireAdminAuth } from "@/lib/server/admin";
import { apiError, json, readJson, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const auth = requireAdminAuth(request);
    if (auth instanceof Response) return auth;
    await ensureServerSchema();

    const rows = await getDb().select().from(cmsPages).orderBy(asc(cmsPages.pageKey));
    return json(rows);
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
    const pageKey = String(body.pageKey ?? "").trim().toLowerCase();
    if (!pageKey) return apiError("pageKey is required", 400);

    const db = getDb();
    const [existing] = await db.select().from(cmsPages).where(eq(cmsPages.pageKey, pageKey));
    if (existing) return apiError("pageKey already exists", 409);

    const row = {
      id: String(body.id ?? randomUUID()),
      pageKey,
      title: String(body.title ?? pageKey).trim(),
      active: body.active == null ? true : Boolean(body.active),
      updatedAt: new Date(),
    };
    await db.insert(cmsPages).values(row);
    return json(row, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}

