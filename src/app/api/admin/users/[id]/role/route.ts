import { eq } from "drizzle-orm";
import { getDb, users } from "@/lib/server/db";
import { requireAdminAuth } from "@/lib/server/admin";
import { apiError, json, readJson, serverError } from "@/lib/server/http";
import { isDevAuthStoreEnabled, publicUser, updateDevUser } from "@/lib/server/devAuthStore";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAdminAuth(request);
    if (auth instanceof Response) return auth;

    const { id } = await context.params;
    const { role } = await readJson(request);
    if (!["user", "admin"].includes(role)) {
      return apiError("Role must be user or admin", 400);
    }

    if (isDevAuthStoreEnabled()) {
      const updatedDevUser = await updateDevUser(id, { role });
      return updatedDevUser ? json(publicUser(updatedDevUser)) : apiError("User not found", 404);
    }

    const db = getDb();
    let updated;
    try {
      await db.update(users).set({ role }).where(eq(users.id, id));
      updated = await db.select().from(users).where(eq(users.id, id));
    } catch (error) {
      if (isDevAuthStoreEnabled(error)) {
        const updatedDevUser = await updateDevUser(id, { role });
        return updatedDevUser ? json(publicUser(updatedDevUser)) : apiError("User not found", 404);
      }
      throw error;
    }

    if (updated.length === 0) return apiError("User not found", 404);

    const user = updated[0];
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

export const PUT = PATCH;
