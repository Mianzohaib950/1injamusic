import { createHash } from "crypto";
import jwt from "jsonwebtoken";
import { apiError } from "./http";

export interface AuthPayload {
  sub: string;
  email: string;
  role: string;
}

function getJwtSecret() {
  return process.env.JWT_SECRET ?? "dev-jwt-secret";
}

export function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export function signJwt(payload: AuthPayload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function getAuthPayload(request: Request): AuthPayload | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  try {
    return jwt.verify(authHeader.slice(7), getJwtSecret()) as AuthPayload;
  } catch {
    return null;
  }
}

export function requireAuth(request: Request): AuthPayload | Response {
  const auth = getAuthPayload(request);
  return auth ?? apiError("Authorization header missing or malformed", 401);
}

export function requireAdmin(auth: AuthPayload): Response | null {
  return auth.role === "admin" ? null : apiError("Admin access required", 403);
}
