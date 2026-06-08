import { asc, eq } from "drizzle-orm";
import { cmsPages, getDb } from "@/lib/server/db";
import { json, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await ensureServerSchema();
    const rows = await getDb()
      .select()
      .from(cmsPages)
      .where(eq(cmsPages.active, true))
      .orderBy(asc(cmsPages.pageKey));
    return json(rows);
  } catch (error) {
    return serverError(error);
  }
}
