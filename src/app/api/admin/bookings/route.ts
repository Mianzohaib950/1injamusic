import { desc } from "drizzle-orm";
import { getDb, bookings } from "@/lib/server/db";
import { requireAdminAuth } from "@/lib/server/admin";
import { json, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const auth = requireAdminAuth(request);
    if (auth instanceof Response) return auth;
    await ensureServerSchema();

    const rows = await getDb().select().from(bookings).orderBy(desc(bookings.createdAt));
    return json(rows);
  } catch (error) {
    return serverError(error);
  }
}
