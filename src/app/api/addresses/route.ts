import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { getDb, addresses } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/auth";
import { apiError, json, readJson } from "@/lib/server/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof Response) return auth;

  const rows = await getDb().select().from(addresses).where(eq(addresses.userId, auth.sub));
  return json(rows);
}

export async function POST(request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof Response) return auth;

  const { label, firstName, lastName, address, city, state, zip, country, isDefault } = await readJson(request);
  if (!label || !firstName || !lastName || !address || !city || !zip || !country) {
    return apiError("Missing required address fields", 400);
  }

  const db = getDb();
  if (isDefault) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, auth.sub));
  }

  const record = {
    id: randomUUID(),
    userId: auth.sub,
    label,
    firstName,
    lastName,
    address,
    city,
    state: state ?? "",
    zip,
    country,
    isDefault: Boolean(isDefault),
  };

  await db.insert(addresses).values(record);
  return json(record, { status: 201 });
}
