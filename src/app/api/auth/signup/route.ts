import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/lib/server/db";
import { hashPassword, signJwt } from "@/lib/server/auth";
import { apiError, json, readJson, serverError } from "@/lib/server/http";
import { createDevUser, isDevAuthStoreEnabled, publicUser } from "@/lib/server/devAuthStore";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { name, email, phone, password } = await readJson(request);
    if (!name || !email || !password) {
      return apiError("Missing required signup fields", 400);
    }

    if (isDevAuthStoreEnabled()) {
      const user = await createDevUser({ name, email, phone, password });
      if (!user) return apiError("An account with that email already exists.", 409);

      const token = signJwt({ sub: user.id, email: user.email, role: user.role });
      return json({ user: publicUser(user), token }, { status: 201 });
    }

    const db = getDb();
    const existingUsers = await db.select().from(users).where(eq(users.email, email));
    if (existingUsers.length > 0) {
      return apiError("An account with that email already exists.", 409);
    }

    const user = {
      id: randomUUID(),
      name,
      email,
      phone: phone ?? "",
      passwordHash: hashPassword(password),
      role: "user",
      createdAt: new Date(),
    };

    await db.insert(users).values(user);

    const token = signJwt({ sub: user.id, email: user.email, role: user.role });
    return json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          createdAt: user.createdAt,
        },
        token,
      },
      { status: 201 },
    );
  } catch (error) {
    return serverError(error);
  }
}
