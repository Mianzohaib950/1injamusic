import type { ArtistProfile } from "@/data/artists";
import { artistProfiles } from "@/data/artists";

const PUBLIC_ARTISTS_CACHE_KEY = "1jm_public_artists_cache";

export function mergePublicArtists(rows: ArtistProfile[]) {
  const bySlug = new Map<string, ArtistProfile>();
  artistProfiles.forEach((artist) => {
    if (artist.active !== false) bySlug.set(artist.slug, artist);
  });
  rows.forEach((artist) => {
    if (!artist?.slug) return;
    if (artist.active === false) {
      bySlug.delete(artist.slug);
      return;
    }
    bySlug.set(artist.slug, artist);
  });

  return Array.from(bySlug.values()).sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name),
  );
}

export function getCachedPublicArtists() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PUBLIC_ARTISTS_CACHE_KEY);
    const rows = raw ? JSON.parse(raw) : null;
    return Array.isArray(rows) ? mergePublicArtists(rows as ArtistProfile[]) : null;
  } catch {
    return null;
  }
}

export function setCachedPublicArtists(rows: ArtistProfile[]) {
  const current = getCachedPublicArtists() ?? [];
  const merged = mergePublicArtists([...current, ...rows]);
  if (typeof window === "undefined") return merged;
  try {
    window.sessionStorage.setItem(PUBLIC_ARTISTS_CACHE_KEY, JSON.stringify(merged));
  } catch {
    // Ignore storage quota errors.
  }
  return merged;
}

export function upsertCachedPublicArtist(artist: ArtistProfile) {
  const current = getCachedPublicArtists() ?? artistProfiles;
  const withoutArtist = current.filter((item) => item.slug !== artist.slug);
  const next = artist.active === false ? withoutArtist : [...withoutArtist, artist];
  return setCachedPublicArtists(next);
}

export function removeCachedPublicArtist(slug: string) {
  const current = getCachedPublicArtists();
  if (!current) return;
  return setCachedPublicArtists(current.filter((artist) => artist.slug !== slug));
}
