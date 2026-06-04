import { eq } from "drizzle-orm";
import { eventContacts, getDb } from "@/lib/server/db";
import { requireAdminAuth } from "@/lib/server/admin";
import { apiError, json, readJson, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";

export const runtime = "nodejs";

const allowedStatuses = ["New", "Contacted", "In Progress", "Resolved", "Closed"];

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAdminAuth(request);
    if (auth instanceof Response) return auth;
    await ensureServerSchema();

    const { id } = await context.params;
    const { status } = await readJson(request);
    if (!allowedStatuses.includes(status)) return apiError("Invalid event contact status", 400);

    const db = getDb();
    await db.update(eventContacts).set({ status, updatedAt: new Date() }).where(eq(eventContacts.id, id));
    const updated = await db.select().from(eventContacts).where(eq(eventContacts.id, id));
    if (updated.length === 0) return apiError("Event contact not found", 404);
    return json(updated[0]);
  } catch (error) {
    return serverError(error);
  }
}
