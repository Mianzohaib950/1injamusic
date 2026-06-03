import { NextResponse } from "next/server";
import { getDatabaseErrorCode, isRecoverableDatabaseError } from "./dbErrors";

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function serverError(error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(error);
  }

  const code = getDatabaseErrorCode(error);
  const type = (error as any)?.type;
  const message = String((error as Error)?.message ?? "");

  if (typeof type === "string" && type.startsWith("Stripe")) {
    return apiError(`Payment provider error: ${message || "Check Stripe configuration and try again."}`, 502);
  }

  if (code === "28P01") {
    return apiError("Database authentication failed. Check DATABASE_URL.", 503);
  }

  if (isRecoverableDatabaseError(error)) {
    return apiError("Database is unavailable. Check DATABASE_URL and network access.", 503);
  }

  if (message.includes("DATABASE_URL")) {
    return apiError("Database is not configured. Check DATABASE_URL.", 503);
  }

  return apiError(message || "Internal server error", 500);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export async function readJson<T = any>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error("Invalid JSON request body");
  }
}
