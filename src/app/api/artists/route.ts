import { asc, eq } from "drizzle-orm";
import { getDb, artists } from "@/lib/server/db";
import { json, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";
import { seedArtists } from "@/lib/server/artistSeed";
import { withDatabaseRetry } from "@/lib/server/dbRetry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const PUBLIC_CACHE_HEADERS = { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400" };

export async function GET() {
  try {
    const rows = await withDatabaseRetry(async () => {
      await ensureServerSchema();
      await seedArtists();

      return getDb()
        .select()
        .from(artists)
        .where(eq(artists.active, true))
        .orderBy(asc(artists.sortOrder), asc(artists.name));
    });

    return json(rows, { headers: PUBLIC_CACHE_HEADERS });
  } catch (error) {
    return serverError(error);
  }
}
