import { asc, eq } from "drizzle-orm";
import { getDb, artists } from "@/lib/server/db";
import { json, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";
import { seedArtists } from "@/lib/server/artistSeed";

export const runtime = "nodejs";

export async function GET() {
  try {
    await ensureServerSchema();
    await seedArtists();

    const rows = await getDb()
      .select()
      .from(artists)
      .where(eq(artists.active, true))
      .orderBy(asc(artists.sortOrder), asc(artists.name));

    return json(rows);
  } catch (error) {
    return serverError(error);
  }
}
