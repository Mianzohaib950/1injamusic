import { requireAdmin, requireAuth, type AuthPayload } from "./auth";

export function requireAdminAuth(request: Request): AuthPayload | Response {
  const auth = requireAuth(request);
  if (auth instanceof Response) return auth;

  const adminError = requireAdmin(auth);
  return adminError ?? auth;
}
