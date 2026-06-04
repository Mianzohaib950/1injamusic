import { desc } from "drizzle-orm";
import { getDb, users } from "@/lib/server/db";
import { requireAdminAuth } from "@/lib/server/admin";
import { json, serverError } from "@/lib/server/http";
import { isDevAuthStoreEnabled, listDevUsers, publicUser } from "@/lib/server/devAuthStore";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const auth = requireAdminAuth(request);
    if (auth instanceof Response) return auth;

    if (isDevAuthStoreEnabled()) {
      const rows = await listDevUsers();
      return json(rows.map(publicUser));
    }

    let rows;
    try {
      rows = await getDb().select().from(users).orderBy(desc(users.createdAt));
    } catch (error) {
      if (isDevAuthStoreEnabled(error)) {
        const devRows = await listDevUsers();
        return json(devRows.map(publicUser));
      }
      throw error;
    }

    return json(
      rows.map((user: typeof users.$inferSelect) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      })),
    );
  } catch (error) {
    return serverError(error);
  }
}
