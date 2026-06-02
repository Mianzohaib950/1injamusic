import { NextResponse } from "next/server";

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function serverError(error: unknown) {
  const cause = (error as any)?.cause;
  const code = cause?.code ?? (error as any)?.code;

  if (code === "28P01") {
    return apiError("Database authentication failed. Check DATABASE_URL.", 503);
  }

  if ((error as Error)?.message?.includes("DATABASE_URL")) {
    return apiError("Database is not configured. Check DATABASE_URL.", 503);
  }

  return apiError("Internal server error", 500);
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
