import { apiError, json } from "@/lib/server/http";
import { artistProfiles } from "@/data/artists";
import { spotifyJson } from "@/lib/server/spotify";
import { readSpotifyCache, writeSpotifyCache } from "@/lib/server/spotifyCache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_HEADERS = { "Cache-Control": "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800" };

declare global {
  // eslint-disable-next-line no-var
  var __spotifyDetailRefreshes: Map<string, Promise<any>> | undefined;
}
const refreshes = globalThis.__spotifyDetailRefreshes ??= new Map();
function releaseKey(item: any) { return String(item.name ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }

async function fetchDetail(id: string) {
  const album = await spotifyJson<any>(`https://api.spotify.com/v1/albums/${id}?market=US`);
  const rosterMatch = artistProfiles.map((artist) => ({ artist, spotifyArtist: album.artists?.find((item: any) => artist.spotifyUrl?.includes(`/artist/${item.id}`)) })).find((item) => item.spotifyArtist);
  const rosterArtist = rosterMatch?.artist;
  if (!rosterArtist) throw new Error("This release is not part of the 1 Jamaica Music roster");
  const artistId = rosterMatch.spotifyArtist.id;
  const catalog = await spotifyJson<any>(`https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&market=US&limit=50`);
  const unique = new Map<string, any>();
  for (const item of catalog.items ?? []) {
    const key = releaseKey(item); const current = unique.get(key);
    if (!current || Number(item.total_tracks ?? 0) > Number(current.total_tracks ?? 0)) unique.set(key, item);
  }
  return {
    release: {
      id: String(album.id), title: String(album.name), artist: rosterArtist.name, artistSlug: rosterArtist.slug,
      artists: (album.artists ?? []).map((item: any) => String(item.name)), type: String(album.album_type ?? "release"),
      releaseDate: String(album.release_date ?? ""), totalTracks: Number(album.total_tracks ?? 0), image: String(album.images?.[0]?.url ?? ""),
      spotifyUrl: String(album.external_urls?.spotify ?? `https://open.spotify.com/album/${album.id}`), label: String(album.label ?? ""),
      copyrights: (album.copyrights ?? []).map((item: any) => String(item.text)),
      tracks: (album.tracks?.items ?? []).sort((a: any, b: any) => Number(a.disc_number ?? 1) - Number(b.disc_number ?? 1) || Number(a.track_number ?? 0) - Number(b.track_number ?? 0)).map((track: any) => ({ id: String(track.id), name: String(track.name), durationMs: Number(track.duration_ms ?? 0), trackNumber: Number(track.track_number ?? 0), artists: (track.artists ?? []).map((item: any) => String(item.name)), spotifyUrl: String(track.external_urls?.spotify ?? `https://open.spotify.com/track/${track.id}`) })),
    },
    moreReleases: [...unique.values()].filter((item) => item.id !== album.id).sort((a, b) => String(b.release_date).localeCompare(String(a.release_date))).slice(0, 6).map((item) => ({ id: String(item.id), title: String(item.name), artist: rosterArtist.name, artistSlug: rosterArtist.slug, type: String(item.album_type ?? "release"), releaseDate: String(item.release_date ?? ""), totalTracks: Number(item.total_tracks ?? 0), image: String(item.images?.[0]?.url ?? ""), spotifyUrl: String(item.external_urls?.spotify ?? `https://open.spotify.com/album/${item.id}`) })),
  };
}

async function refreshDetail(id: string) {
  if (!refreshes.has(id)) refreshes.set(id, fetchDetail(id).then(async (payload) => { await writeSpotifyCache(`spotify-detail-${id}`, payload); return payload; }).finally(() => refreshes.delete(id)));
  return refreshes.get(id)!;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[A-Za-z0-9]+$/.test(id)) return apiError("Invalid Spotify release id", 400);
  const cached = await readSpotifyCache<any>(`spotify-detail-${id}`);
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) return json({ ...cached.payload, stale: false, cached: true }, { headers: CACHE_HEADERS });
  try { return json({ ...(await refreshDetail(id)), stale: false, cached: false }, { headers: CACHE_HEADERS }); }
  catch (error) {
    if (cached) return json({ ...cached.payload, stale: true, cached: true, error: "Spotify is unavailable; showing saved album details." }, { headers: CACHE_HEADERS });
    return json({ release: null, moreReleases: [], stale: true, cached: false, error: error instanceof Error && error.message.includes("quota is exhausted") ? "Spotify quota is exhausted and no saved album details are available yet." : "Spotify album details are temporarily unavailable." }, { headers: { "Cache-Control": "no-store" } });
  }
}
