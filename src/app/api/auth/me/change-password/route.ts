import { eq } from "drizzle-orm";
import { getDb, users } from "@/lib/server/db";
import { hashPassword, requireAuth } from "@/lib/server/auth";
import { apiError, json, readJson, serverError } from "@/lib/server/http";
import { findDevUserById, isDevAuthStoreEnabled, updateDevUser } from "@/lib/server/devAuthStore";

export const runtime = "nodejs";

async function changeDevPassword(id: string, currentPassword: string, newPassword: string) {
  const user = await findDevUserById(id);
  if (!user) return apiError("User not found", 404);
  if (user.passwordHash !== hashPassword(currentPassword)) {
    return apiError("Current password is incorrect", 401);
  }

  await updateDevUser(id, { passwordHash: hashPassword(newPassword) });
  return json({ success: true });
}

export async function POST(request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof Response) return auth;

  try {
    const { currentPassword, newPassword } = await readJson(request);
    if (!currentPassword || !newPassword) return apiError("Missing password fields", 400);

    if (isDevAuthStoreEnabled()) {
      return changeDevPassword(auth.sub, currentPassword, newPassword);
    }

    const db = getDb();
    let results;
    try {
      results = await db.select().from(users).where(eq(users.id, auth.sub));
    } catch (error) {
      if (isDevAuthStoreEnabled(error)) {
        return changeDevPassword(auth.sub, currentPassword, newPassword);
      }
      throw error;
    }

    const user = results[0];
    if (!user) return apiError("User not found", 404);
    if (user.passwordHash !== hashPassword(currentPassword)) {
      return apiError("Current password is incorrect", 401);
    }

    await db.update(users).set({ passwordHash: hashPassword(newPassword) }).where(eq(users.id, auth.sub));
    return json({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
