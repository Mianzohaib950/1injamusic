import { randomUUID } from "crypto";

// Support the environment variable name already used by existing deployments.
// New deployments should use the server-only SUPABASE_URL name.
process.env.SUPABASE_URL ||= process.env.NEXT_PUBLIC_SUPABASE_URL;

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/ogg": "ogv",
  "video/quicktime": "mov",
};

function parseDataUrl(value: string) {
  if (!value.startsWith("data:")) return null;

  const commaIndex = value.indexOf(",");
  if (commaIndex < 0) return null;

  const meta = value.slice(5, commaIndex);
  const metaParts = meta.split(";").map((part) => part.trim().toLowerCase());
  const mimeType = metaParts[0];
  if (!mimeType || !metaParts.includes("base64")) return null;

  const base64 = value.slice(commaIndex + 1).trim();
  if (!base64) return null;

  return {
    mimeType,
    base64,
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

async function ensurePublicBucket(supabaseUrl: string, serviceRoleKey: string, bucket: string) {
  const response = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
    method: "POST",
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ id: bucket, name: bucket, public: true }),
  });
  if (!response.ok && response.status !== 409) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Unable to create storage bucket "${bucket}" (${response.status}): ${detail || "unknown error"}`);
  }
}

export async function uploadImageIfNeeded(value: unknown, folder: string, bucketCreated = false) {
  if (typeof value !== "string") return value;
  const source = value.trim();
  if (!source) return source;

  const parsed = parseDataUrl(source);
  if (!parsed) return source;

  const supabaseUrl = String(process.env.SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
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
      "Cache-Control": "public, max-age=31536000, immutable",
      "x-upsert": "true",
    },
    body: buffer,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text().catch(() => "");
    if (/bucket not found|nosuchbucket/i.test(errorText)) {
      if (bucketCreated) throw new Error(`Storage bucket "${bucket}" is unavailable after creation. Verify the Supabase project and service-role key.`);
      await ensurePublicBucket(supabaseUrl, serviceRoleKey, bucket);
      return uploadImageIfNeeded(value, folder, true);
    }
    throw new Error(`Supabase storage upload failed (${uploadResponse.status}): ${errorText || "unknown error"}`);
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodedObjectPath(objectPath)}`;
}

export async function uploadMediaFile(file: File, folder: string, bucketCreated = false) {
  const supabaseUrl = String(process.env.SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  const bucket = String(process.env.SUPABASE_STORAGE_BUCKET ?? "").trim();
  if (!supabaseUrl || !serviceRoleKey || !bucket) {
    throw new Error("Supabase storage is not configured");
  }

  const extension = EXTENSION_BY_MIME[file.type] ?? file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const safeFolder = normalizeFolder(folder);
  const objectPath = `${safeFolder}/${Date.now()}-${randomUUID()}.${extension}`;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${encodedObjectPath(objectPath)}`;
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": file.type || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      "x-upsert": "true",
    },
    body: Buffer.from(await file.arrayBuffer()),
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text().catch(() => "");
    if (/bucket not found|nosuchbucket/i.test(errorText)) {
      if (bucketCreated) throw new Error(`Storage bucket "${bucket}" is unavailable after creation. Verify the Supabase project and service-role key.`);
      await ensurePublicBucket(supabaseUrl, serviceRoleKey, bucket);
      return uploadMediaFile(file, folder, true);
    }
    throw new Error(`Supabase storage upload failed (${uploadResponse.status}): ${errorText || "unknown error"}`);
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodedObjectPath(objectPath)}`;
}
