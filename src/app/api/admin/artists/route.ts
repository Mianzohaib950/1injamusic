import { desc } from "drizzle-orm";
import { getDb, artists } from "@/lib/server/db";
import { requireAdminAuth } from "@/lib/server/admin";
import { seedArtists } from "@/lib/server/artistSeed";
import { apiError, json, readJson, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";
import { uploadImageIfNeeded } from "@/lib/server/supabaseStorage";
import { withDatabaseRetry } from "@/lib/server/dbRetry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function artistInput(body: any) {
  return {
    slug: body.slug,
    name: body.name,
    genres: Array.isArray(body.genres) ? body.genres : [],
    bio: body.bio ?? "",
    image: body.image ?? "",
    bookingEmail: body.bookingEmail ?? "booking@1jamaicamusic.com",
    active: body.active == null ? true : Boolean(body.active),
    sortOrder: Number(body.sortOrder ?? 0),
  };
}

export async function GET(request: Request) {
  try {
    const auth = requireAdminAuth(request);
    if (auth instanceof Response) return auth;

    const rows = await withDatabaseRetry(async () => {
      await ensureServerSchema();
      await seedArtists();
      return getDb().select().from(artists).orderBy(desc(artists.createdAt));
    });
    return json(rows, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireAdminAuth(request);
    if (auth instanceof Response) return auth;

    const body = await readJson(request);
    const item = artistInput(body);
    if (!item.slug || !item.name || !item.image || !String(item.image).trim()) {
      return apiError("Slug, name, and image URL are required", 400);
    }

    const resolvedItem = {
      ...item,
      image: await uploadImageIfNeeded(item.image, "artists/profile"),
    };

    await withDatabaseRetry(async () => {
      await ensureServerSchema();
      await getDb().insert(artists).values(resolvedItem);
    });
    return json(resolvedItem, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return serverError(error);
  }
}
