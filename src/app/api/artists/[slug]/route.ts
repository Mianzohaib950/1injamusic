import { and, eq } from "drizzle-orm";
import { getDb, artists } from "@/lib/server/db";
import { apiError, json, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";
import { seedArtists } from "@/lib/server/artistSeed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    await ensureServerSchema();
    await seedArtists();

    const { slug } = await context.params;
    const rows = await getDb()
      .select()
      .from(artists)
      .where(and(eq(artists.slug, slug), eq(artists.active, true)));

    if (rows.length === 0) return apiError("Artist not found", 404);
    return json(rows[0], { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return serverError(error);
  }
}
