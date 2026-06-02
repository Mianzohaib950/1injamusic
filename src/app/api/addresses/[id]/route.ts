import { eq } from "drizzle-orm";
import { getDb, addresses } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/auth";
import { apiError, json, noContent, readJson } from "@/lib/server/http";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (auth instanceof Response) return auth;

  const { id } = await context.params;
  const { label, firstName, lastName, address, city, state, zip, country, isDefault } = await readJson(request);
  if (!label || !firstName || !lastName || !address || !city || !zip || !country) {
    return apiError("Missing required address fields", 400);
  }

  const db = getDb();
  const target = await db.select().from(addresses).where(eq(addresses.id, id)).limit(1);
  if (target.length === 0 || target[0].userId !== auth.sub) {
    return apiError("Address not found", 404);
  }

  if (isDefault) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, auth.sub));
  }

  await db
    .update(addresses)
    .set({
      label,
      firstName,
      lastName,
      address,
      city,
      state: state ?? "",
      zip,
      country,
      isDefault: Boolean(isDefault),
    })
    .where(eq(addresses.id, id));

  const updated = await db.select().from(addresses).where(eq(addresses.id, id));
  return json(updated[0]);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (auth instanceof Response) return auth;

  const { id } = await context.params;
  const db = getDb();
  const target = await db.select().from(addresses).where(eq(addresses.id, id)).limit(1);
  if (target.length === 0 || target[0].userId !== auth.sub) {
    return apiError("Address not found", 404);
  }

  await db.delete(addresses).where(eq(addresses.id, id));
  return noContent();
}
