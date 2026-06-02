import { eq } from "drizzle-orm";
import { getDb, users } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/auth";
import { apiError, json, readJson, serverError } from "@/lib/server/http";
import { findDevUserById, isDevAuthStoreEnabled, publicUser, updateDevUser } from "@/lib/server/devAuthStore";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof Response) return auth;

  try {
    if (isDevAuthStoreEnabled()) {
      const user = await findDevUserById(auth.sub);
      return user ? json(publicUser(user)) : apiError("User not found", 404);
    }

    const results = await getDb().select().from(users).where(eq(users.id, auth.sub));
    const user = results[0];
    if (!user) return apiError("User not found", 404);

    return json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof Response) return auth;

  try {
    const { name, phone } = await readJson(request);
    if (!name && !phone) return apiError("Missing update fields", 400);

    if (isDevAuthStoreEnabled()) {
      const user = await updateDevUser(auth.sub, { name: name ?? undefined, phone: phone ?? undefined });
      return user ? json(publicUser(user)) : apiError("User not found", 404);
    }

    const db = getDb();
    await db.update(users).set({ name: name ?? undefined, phone: phone ?? undefined }).where(eq(users.id, auth.sub));
    const results = await db.select().from(users).where(eq(users.id, auth.sub));
    const user = results[0];
    if (!user) return apiError("User not found", 404);

    return json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    return serverError(error);
  }
}
