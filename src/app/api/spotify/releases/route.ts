import { asc, eq } from "drizzle-orm";
import { artists, getDb } from "@/lib/server/db";
import { ensureServerSchema } from "@/lib/server/schemaSync";
import { apiError, json, serverError } from "@/lib/server/http";
import { withDatabaseRetry } from "@/lib/server/dbRetry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_HEADERS = { "Cache-Control": "public, max-age=300, s-maxage=1800, stale-while-revalidate=86400" };

function spotifyArtistId(url: string) {
  return url.match(/open\.spotify\.com\/artist\/([A-Za-z0-9]+)/)?.[1] ?? "";
}

async function getSpotifyToken() {
  const clientId = String(process.env.SPOTIFY_CLIENT_ID ?? "").trim();
  const clientSecret = String(process.env.SPOTIFY_CLIENT_SECRET ?? "").trim();
  if (!clientId || !clientSecret) return "";
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Spotify authentication failed (${response.status})`);
  const payload = await response.json() as { access_token?: string };
  return payload.access_token ?? "";
}

export async function GET() {
  try {
    const token = await getSpotifyToken();
    if (!token) return apiError("Spotify API is not configured", 503);

    const rows = await withDatabaseRetry(async () => {
      await ensureServerSchema();
      return getDb().select().from(artists).where(eq(artists.active, true)).orderBy(asc(artists.sortOrder));
    });

    const catalogs = await Promise.all(rows.map(async (artist: typeof artists.$inferSelect) => {
      const id = spotifyArtistId(artist.spotifyUrl);
      if (!id) return { releases: [], error: "Spotify artist URL is missing" };
      const endpoint = new URL(`https://api.spotify.com/v1/artists/${id}/albums`);
      endpoint.searchParams.set("include_groups", "album,single");
      endpoint.searchParams.set("market", "US");
      endpoint.searchParams.set("limit", "10");

      const items: any[] = [];
      let nextUrl: string | null = endpoint.toString();
      let pageCount = 0;
      while (nextUrl && pageCount < 5) {
        const response = await fetch(nextUrl, {
          headers: { Authorization: `Bearer ${token}` },
          next: { revalidate: 1800 },
        });
        if (!response.ok) {
          const detail = await response.text().catch(() => "");
          return { releases: [], error: `${artist.name}: Spotify returned ${response.status}${detail ? ` - ${detail.slice(0, 160)}` : ""}` };
        }
        const payload = await response.json() as { items?: any[]; next?: string | null };
        items.push(...(payload.items ?? []));
        nextUrl = payload.next ?? null;
        pageCount += 1;
      }

      const releases = items.map((release) => ({
        id: String(release.id),
        title: String(release.name),
        artist: artist.name,
        artistSlug: artist.slug,
        type: String(release.album_type ?? "release"),
        releaseDate: String(release.release_date ?? ""),
        totalTracks: Number(release.total_tracks ?? 0),
        image: String(release.images?.[0]?.url ?? ""),
        spotifyUrl: String(release.external_urls?.spotify ?? `https://open.spotify.com/album/${release.id}`),
      }));
      return { releases, error: "" };
    }));

    const unique = new Map<string, any>();
    catalogs.flatMap((catalog) => catalog.releases).forEach((release) => unique.set(release.id, release));
    const releases = [...unique.values()].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
    const errors = catalogs.map((catalog) => catalog.error).filter(Boolean);
    return json({ releases, errors }, { headers: CACHE_HEADERS });
  } catch (error) {
    return serverError(error);
  }
}
