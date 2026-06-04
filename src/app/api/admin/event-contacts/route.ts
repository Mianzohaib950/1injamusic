import { desc } from "drizzle-orm";
import { eventContacts, getDb } from "@/lib/server/db";
import { requireAdminAuth } from "@/lib/server/admin";
import { json, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const auth = requireAdminAuth(request);
    if (auth instanceof Response) return auth;
    await ensureServerSchema();

    const rows = await getDb().select().from(eventContacts).orderBy(desc(eventContacts.createdAt));
    return json(rows);
  } catch (error) {
    return serverError(error);
  }
}
