import { asc, eq } from "drizzle-orm";
import { getDb, categories } from "@/lib/server/db";
import { json, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";

export const runtime = "nodejs";

export async function GET() {
  try {
    await ensureServerSchema();
    const rows = await getDb()
      .select()
      .from(categories)
      .where(eq(categories.active, true))
      .orderBy(asc(categories.sortOrder), asc(categories.name));
    return json(rows);
  } catch (error) {
    return serverError(error);
  }
}
