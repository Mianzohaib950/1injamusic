import { json } from "@/lib/server/http";
import { artistProfiles } from "@/data/artists";
import { clearSpotifyQuotaBlock, spotifyJson } from "@/lib/server/spotify";
import { readSpotifyCache, writeSpotifyCache } from "@/lib/server/spotifyCache";
import type { SpotifyRelease } from "@/lib/spotifyReleaseCache";
import { requireAdminAuth } from "@/lib/server/admin";
import { apiError } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const CACHE_KEY = "spotify-releases-v2";
const TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_HEADERS = { "Cache-Control": "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800" };

declare global {
  // eslint-disable-next-line no-var
  var __spotifyReleasesRefresh: Promise<{ releases: SpotifyRelease[]; errors: string[] }> | undefined;
  // eslint-disable-next-line no-var
  var __spotifyManualRefreshAt: number | undefined;
}

function releaseKey(artistSlug: string, title: string) {
  return `${artistSlug}:${title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()}`;
}
function spotifyArtistId(url: string) { return url.match(/open\.spotify\.com\/artist\/([A-Za-z0-9]+)/)?.[1] ?? ""; }

async function fetchSpotifyReleases() {
  const catalogs: Array<{ releases: SpotifyRelease[]; error: string }> = [];
  for (const artist of artistProfiles.filter((item) => item.active !== false)) {
    const id = spotifyArtistId(artist.spotifyUrl ?? "");
    if (!id) { catalogs.push({ releases: [], error: `${artist.name}: Spotify artist URL is missing` }); continue; }
    const endpoint = new URL(`https://api.spotify.com/v1/artists/${id}/albums`);
    endpoint.searchParams.set("include_groups", "album,single");
    endpoint.searchParams.set("market", "US");
    endpoint.searchParams.set("limit", "50");
    try {
      const payload = await spotifyJson<{ items?: any[] }>(endpoint.toString());
      catalogs.push({ releases: (payload.items ?? []).map((release): SpotifyRelease => ({
        id: String(release.id), title: String(release.name), artist: artist.name, artistSlug: artist.slug,
        type: String(release.album_type ?? "release"), releaseDate: String(release.release_date ?? ""),
        totalTracks: Number(release.total_tracks ?? 0), image: String(release.images?.[0]?.url ?? ""),
        spotifyUrl: String(release.external_urls?.spotify ?? `https://open.spotify.com/album/${release.id}`),
      })), error: "" });
    } catch (error) {
      if (error instanceof Error && error.message.includes("quota is exhausted")) throw error;
      catalogs.push({ releases: [], error: `${artist.name}: ${error instanceof Error ? error.message : "Spotify request failed"}` });
    }
  }
  const unique = new Map<string, SpotifyRelease>();
  catalogs.flatMap((catalog) => catalog.releases).forEach((release) => {
    const key = releaseKey(release.artistSlug, release.title);
    const current = unique.get(key);
    if (!current || release.totalTracks > current.totalTracks) unique.set(key, release);
  });
  return { releases: [...unique.values()].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate)), errors: catalogs.map((catalog) => catalog.error).filter(Boolean) };
}

async function refreshSpotifyReleases() {
  if (!globalThis.__spotifyReleasesRefresh) {
    globalThis.__spotifyReleasesRefresh = fetchSpotifyReleases().then(async (payload) => {
      if (payload.releases.length > 0) await writeSpotifyCache(CACHE_KEY, payload);
      return payload;
    }).finally(() => { globalThis.__spotifyReleasesRefresh = undefined; });
  }
  return globalThis.__spotifyReleasesRefresh;
}

export async function GET() {
  const cached = await readSpotifyCache<{ releases: SpotifyRelease[]; errors: string[] }>(CACHE_KEY);
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) return json({ ...cached.payload, stale: false, cached: true }, { headers: CACHE_HEADERS });
  try {
    const payload = await refreshSpotifyReleases();
    return json({ ...payload, stale: false, cached: false }, { headers: CACHE_HEADERS });
  } catch (error) {
    const quota = error instanceof Error && error.message.includes("quota is exhausted");
    if (cached) return json({ ...cached.payload, stale: true, cached: true, error: quota ? "Spotify quota is exhausted; showing saved releases." : "Spotify is unavailable; showing saved releases." }, { headers: CACHE_HEADERS });
    return json({ releases: [], errors: [], stale: true, cached: false, error: quota ? "Spotify quota is exhausted and no saved Spotify catalog is available yet." : "Spotify is temporarily unavailable." }, { headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: Request) {
  const auth = requireAdminAuth(request);
  if (auth instanceof Response) return auth;
  const cooldownMs = 5 * 60 * 1000;
  const now = Date.now();
  const lastRefresh = globalThis.__spotifyManualRefreshAt ?? 0;
  if (now - lastRefresh < cooldownMs) return apiError("Spotify refresh is limited to once every 5 minutes.", 429);
  globalThis.__spotifyManualRefreshAt = now;
  try {
    clearSpotifyQuotaBlock();
    const payload = await refreshSpotifyReleases();
    return json({ ...payload, refreshed: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error instanceof Error && error.message.includes("quota is exhausted") ? "Spotify development quota is exhausted; saved releases remain available." : "Spotify refresh failed; saved releases remain available.", 503);
  }
}
