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

    const devRows = process.env.VERCEL ? [] : await listDevUsers();

    let rows;
    try {
      rows = await getDb().select().from(users).orderBy(desc(users.createdAt));
    } catch (error) {
      if (isDevAuthStoreEnabled(error)) {
        return json(devRows.map(publicUser));
      }
      throw error;
    }

    const dbUsers = rows.map((user: typeof users.$inferSelect) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    }));
    const merged = [...dbUsers];
    const seenEmails = new Set(merged.map((user) => String(user.email).toLowerCase()));

    devRows.map(publicUser).forEach((user) => {
      const email = String(user.email).toLowerCase();
      if (!seenEmails.has(email)) {
        seenEmails.add(email);
        merged.push(user);
      }
    });

    return json(merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  } catch (error) {
    return serverError(error);
  }
}
