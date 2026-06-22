import { asc } from "drizzle-orm";
import { getDb, categories } from "@/lib/server/db";
import { requireAdminAuth } from "@/lib/server/admin";
import { apiError, json, readJson, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";

export const runtime = "nodejs";

function slugify(value: string) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(request: Request) {
  try {
    const auth = requireAdminAuth(request);
    if (auth instanceof Response) return auth;
    await ensureServerSchema();

    const rows = await getDb().select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
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

    const body = await readJson<any>(request);
    const rawSlug = String(body.slug ?? "").trim();
    const rawName = String(body.name ?? "").trim();
    const slug = slugify(rawSlug || rawName);
    const name = rawName || slug.replace(/-/g, " ");
    if (!slug || !name) {
      return apiError("Category slug and name are required", 400);
    }

    const item = {
      slug,
      name,
      active: body.active == null ? true : Boolean(body.active),
      sortOrder: Number(body.sortOrder ?? 0),
    };

    await getDb().insert(categories).values(item);
    return json(item, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
