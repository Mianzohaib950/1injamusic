import { desc } from "drizzle-orm";
import { getDb, artists } from "@/lib/server/db";
import { requireAdminAuth } from "@/lib/server/admin";
import { seedArtists } from "@/lib/server/artistSeed";
import { apiError, json, readJson, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";
import { uploadImageIfNeeded } from "@/lib/server/supabaseStorage";

export const runtime = "nodejs";

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
    await ensureServerSchema();

    await seedArtists();
    const rows = await getDb().select().from(artists).orderBy(desc(artists.createdAt));
    return json(rows);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireAdminAuth(request);
    if (auth instanceof Response) return auth;
    await ensureServerSchema();

    const body = await readJson(request);
    const item = artistInput(body);
    if (!item.slug || !item.name || !item.image || !String(item.image).trim()) {
      return apiError("Slug, name, and image URL are required", 400);
    }

    const resolvedItem = {
      ...item,
      image: await uploadImageIfNeeded(item.image, "artists/profile"),
    };

    await getDb().insert(artists).values(resolvedItem);
    return json(resolvedItem, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
