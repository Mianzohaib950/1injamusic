import { getDb, artists } from "./db";
import { artistProfiles } from "@/data/artists";
import { ensureServerSchema } from "./schemaSync";

export async function seedArtists() {
  await ensureServerSchema();
  const db = getDb();
  const existing = await db.select().from(artists);
  if (existing.length > 0) return;

  await db.insert(artists).values(artistProfiles);
}
