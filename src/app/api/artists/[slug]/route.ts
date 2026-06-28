import { and, eq } from "drizzle-orm";
import { getDb, artists } from "@/lib/server/db";
import { apiError, json, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";
import { seedArtists } from "@/lib/server/artistSeed";
import { withDatabaseRetry } from "@/lib/server/dbRetry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const PUBLIC_CACHE_HEADERS = { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400" };

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const rows = await withDatabaseRetry(async () => {
      await ensureServerSchema();
      await seedArtists();

      return getDb()
        .select()
        .from(artists)
        .where(and(eq(artists.slug, slug), eq(artists.active, true)));
    });

    if (rows.length === 0) return apiError("Artist not found", 404);
    return json(rows[0], { headers: PUBLIC_CACHE_HEADERS });
  } catch (error) {
    return serverError(error);
  }
}
