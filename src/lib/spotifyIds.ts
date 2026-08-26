export function getSpotifyAlbumId(value: unknown) {
  const text = String(value ?? "").trim();
  if (/^[A-Za-z0-9]{10,}$/.test(text)) return text;
  return text.match(/open\.spotify\.com\/album\/([A-Za-z0-9]+)/i)?.[1] ?? "";
}

export type SpotifyEmbedType = "album" | "track" | "playlist";

export function getSpotifyEmbed(value: unknown): { type: SpotifyEmbedType; id: string } | null {
  const text = String(value ?? "").trim().replace(/&amp;/g, "&");
  const match = text.match(/open\.spotify\.com\/(?:embed\/)?(album|track|playlist)\/([A-Za-z0-9]+)/i);
  if (match) return { type: match[1].toLowerCase() as SpotifyEmbedType, id: match[2] };
  if (/^[A-Za-z0-9]{10,}$/.test(text)) return { type: "album", id: text };
  return null;
}
