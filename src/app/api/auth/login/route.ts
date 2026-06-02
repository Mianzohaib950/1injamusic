import { eq } from "drizzle-orm";
import { getDb, users } from "@/lib/server/db";
import { hashPassword, signJwt } from "@/lib/server/auth";
import { apiError, json, readJson, serverError } from "@/lib/server/http";
import { findDevUserByEmail, isDevAuthStoreEnabled, publicUser } from "@/lib/server/devAuthStore";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { email, password } = await readJson(request);
    if (!email || !password) {
      return apiError("Missing email or password", 400);
    }

    if (isDevAuthStoreEnabled()) {
      const user = await findDevUserByEmail(email);
      if (!user || user.passwordHash !== hashPassword(password)) {
        return apiError("Invalid credentials", 401);
      }

      const token = signJwt({ sub: user.id, email: user.email, role: user.role });
      return json({ user: publicUser(user), token });
    }

    const results = await getDb().select().from(users).where(eq(users.email, email));
    const user = results[0];
    if (!user || user.passwordHash !== hashPassword(password)) {
      return apiError("Invalid credentials", 401);
    }

    const token = signJwt({ sub: user.id, email: user.email, role: user.role });
    return json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    return serverError(error);
  }
}
