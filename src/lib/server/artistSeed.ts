import { getDb, artists } from "./db";
import { artistProfiles } from "@/data/artists";
import { ensureServerSchema } from "./schemaSync";
import { inArray } from "drizzle-orm";

export async function seedArtists() {
  await ensureServerSchema();
  const db = getDb();
  const defaultSlugs = artistProfiles.map((artist) => artist.slug);
  const existingDefaults = await db
    .select({ slug: artists.slug })
    .from(artists)
    .where(inArray(artists.slug, defaultSlugs));
  const existingSlugs = new Set(existingDefaults.map((artist: { slug: string }) => artist.slug));

  const missingDefaults = artistProfiles.filter((artist) => !existingSlugs.has(artist.slug));
  if (missingDefaults.length > 0) {
    await db.insert(artists).values(missingDefaults);
  }

  await db
    .update(artists)
    .set({ active: true, updatedAt: new Date() })
    .where(inArray(artists.slug, defaultSlugs));
}
