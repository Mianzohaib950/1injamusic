import { getPool } from "./db";
import { ensureServerSchema } from "./schemaSync";

export type SpotifyCacheEntry<T> = { payload: T; fetchedAt: number };

declare global {
  // eslint-disable-next-line no-var
  var __spotifyMemoryCache: Map<string, SpotifyCacheEntry<unknown>> | undefined;
}

const memoryCache = globalThis.__spotifyMemoryCache ??= new Map();

export async function readSpotifyCache<T>(key: string): Promise<SpotifyCacheEntry<T> | null> {
  const memory = memoryCache.get(key) as SpotifyCacheEntry<T> | undefined;
  try {
    await ensureServerSchema();
    const result = await getPool().query<{ payload: T; fetched_at: Date }>(
      "select payload, fetched_at from spotify_api_cache where cache_key = $1 limit 1",
      [key],
    );
    const row = result.rows[0];
    if (row) {
      const entry = { payload: row.payload, fetchedAt: new Date(row.fetched_at).valueOf() };
      memoryCache.set(key, entry);
      return entry;
    }
  } catch {
    // The in-memory last-good value still protects this server instance.
  }
  return memory ?? null;
}

export async function writeSpotifyCache<T>(key: string, payload: T) {
  const entry = { payload, fetchedAt: Date.now() };
  memoryCache.set(key, entry);
  try {
    await ensureServerSchema();
    await getPool().query(
      `insert into spotify_api_cache (cache_key, payload, fetched_at, updated_at)
       values ($1, $2::jsonb, now(), now())
       on conflict (cache_key) do update set payload = excluded.payload, fetched_at = now(), updated_at = now()`,
      [key, JSON.stringify(payload)],
    );
  } catch {
    // A database outage must not discard a successful Spotify response.
  }
  return entry;
}
