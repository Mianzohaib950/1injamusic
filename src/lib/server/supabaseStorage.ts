import { randomUUID } from "crypto";

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

function parseDataUrl(value: string) {
  const match = value.match(/^data:([^;]+);base64,([\s\S]+)$/);
  if (!match) return null;
  return {
    mimeType: match[1].toLowerCase(),
    base64: match[2],
  };
}

function normalizeFolder(folder: string) {
  return folder
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join("/");
}

function encodedObjectPath(path: string) {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export async function uploadImageIfNeeded(value: unknown, folder: string) {
  if (typeof value !== "string") return value;
  const source = value.trim();
  if (!source) return source;

  const parsed = parseDataUrl(source);
  if (!parsed) return source;

  const supabaseUrl = String(process.env.SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  const bucket = String(process.env.SUPABASE_STORAGE_BUCKET ?? "").trim();
  if (!supabaseUrl || !serviceRoleKey || !bucket) {
    return source;
  }

  const extension = EXTENSION_BY_MIME[parsed.mimeType] ?? "bin";
  const safeFolder = normalizeFolder(folder);
  const objectPath = `${safeFolder}/${Date.now()}-${randomUUID()}.${extension}`;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${encodedObjectPath(objectPath)}`;

  const buffer = Buffer.from(parsed.base64, "base64");
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": parsed.mimeType,
      "x-upsert": "true",
    },
    body: buffer,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text().catch(() => "");
    throw new Error(`Supabase storage upload failed (${uploadResponse.status}): ${errorText || "unknown error"}`);
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodedObjectPath(objectPath)}`;
}
