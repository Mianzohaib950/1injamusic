export type SpotifyRelease = {
  id: string;
  title: string;
  artist: string;
  artistSlug: string;
  type: string;
  releaseDate: string;
  totalTracks: number;
  image: string;
  spotifyUrl: string;
  videoUrl?: string;
  description?: string;
  spotifyEmbedType?: "album" | "track" | "playlist";
  spotifyEmbedId?: string;
};

export type SpotifyTrack = { id: string; name: string; durationMs: number; trackNumber: number; artists: string[]; spotifyUrl: string };
export type SpotifyReleaseDetail = SpotifyRelease & { artists: string[]; label: string; copyrights: string[]; tracks: SpotifyTrack[] };

const CACHE_KEY = "1jm_spotify_releases_v1";

export function getCachedSpotifyReleases(): SpotifyRelease[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.sessionStorage.getItem(CACHE_KEY) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function cacheSpotifyReleases(releases: SpotifyRelease[]) {
  if (typeof window === "undefined" || releases.length === 0) return;
  try {
    const merged = new Map(getCachedSpotifyReleases().map((release) => [release.id, release]));
    releases.forEach((release) => merged.set(release.id, release));
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify([...merged.values()]));
  } catch {
    // The live response still remains available in component state.
  }
}
