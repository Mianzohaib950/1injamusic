type SpotifyTokenResponse = { access_token?: string; expires_in?: number };

let cachedToken = "";
let tokenExpiresAt = 0;
let pendingToken: Promise<string> | null = null;

declare global {
  // eslint-disable-next-line no-var
  var __spotifyQuotaBlockedUntil: number | undefined;
}

export function clearSpotifyQuotaBlock() {
  globalThis.__spotifyQuotaBlockedUntil = 0;
}

async function requestToken() {
  const clientId = String(process.env.SPOTIFY_CLIENT_ID ?? "").trim();
  const clientSecret = String(process.env.SPOTIFY_CLIENT_SECRET ?? "").trim();
  if (!clientId || !clientSecret) throw new Error("Spotify API is not configured");

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

  const payload = await response.json() as SpotifyTokenResponse;
  if (!payload.access_token) throw new Error("Spotify did not return an access token");
  cachedToken = payload.access_token;
  tokenExpiresAt = Date.now() + Math.max(60, Number(payload.expires_in ?? 3600) - 60) * 1000;
  return cachedToken;
}

export async function getSpotifyToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;
  if (!pendingToken) pendingToken = requestToken().finally(() => { pendingToken = null; });
  return pendingToken;
}

export async function spotifyJson<T>(url: string): Promise<T> {
  if (Date.now() < (globalThis.__spotifyQuotaBlockedUntil ?? 0)) throw new Error("Spotify development quota is exhausted");
  let token = await getSpotifyToken();
  let response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 1800 } });

  if (response.status === 401) {
    cachedToken = "";
    tokenExpiresAt = 0;
    token = await getSpotifyToken();
    response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  }
  if (response.status === 429) {
    const body = await response.clone().json().catch(() => null) as { error?: { reason?: string } } | null;
    if (body?.error?.reason === "QUOTA_EXCEEDED") {
      globalThis.__spotifyQuotaBlockedUntil = Date.now() + 24 * 60 * 60 * 1000;
      throw new Error("Spotify development quota is exhausted");
    }
    const retryAfter = Math.min(Number(response.headers.get("retry-after") ?? 1) || 1, 30);
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  }
  if (!response.ok) throw new Error(`Spotify returned ${response.status}`);
  return response.json() as Promise<T>;
}
