import { asc, eq } from "drizzle-orm";
import { cmsPages, getDb } from "@/lib/server/db";
import { json, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";
import { withDatabaseRetry } from "@/lib/server/dbRetry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 300;
const PUBLIC_CACHE_HEADERS = { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400" };

export async function GET() {
  try {
    const rows = await withDatabaseRetry(async () => {
      await ensureServerSchema();
      return getDb()
        .select()
        .from(cmsPages)
        .where(eq(cmsPages.active, true))
        .orderBy(asc(cmsPages.pageKey));
    });
    return json(rows, { headers: PUBLIC_CACHE_HEADERS });
  } catch (error) {
    return serverError(error);
  }
}
