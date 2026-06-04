import { eq } from "drizzle-orm";
import { getDb, bookings } from "@/lib/server/db";
import { requireAdminAuth } from "@/lib/server/admin";
import { apiError, json, readJson, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";

export const runtime = "nodejs";

const allowedStatuses = ["New", "Contacted", "Confirmed", "Declined", "Completed"];

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
    if (!allowedStatuses.includes(status)) return apiError("Invalid booking status", 400);

    const db = getDb();
    await db.update(bookings).set({ status, updatedAt: new Date() }).where(eq(bookings.id, id));
    const updated = await db.select().from(bookings).where(eq(bookings.id, id));
    if (updated.length === 0) return apiError("Booking not found", 404);
    return json(updated[0]);
  } catch (error) {
    return serverError(error);
  }
}
