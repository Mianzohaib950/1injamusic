const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

export interface ApiErrorResponse {
  error?: string;
  message?: string;
}

async function parseResponse(response: Response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = (data && (data.error || data.message || JSON.stringify(data))) || response.statusText;
    const error = new Error(message);
    (error as any).status = response.status;
    (error as any).data = data;
    throw error;
  }
  return data;
}

type ApiRequestInit = Omit<RequestInit, "body"> & {
  body?: unknown;
};

function isBodyInit(body: unknown): body is BodyInit {
  return (
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  );
}

function getAuthToken() {
  return typeof window !== "undefined" ? localStorage.getItem("1jm_token") : null;
}

export async function apiFetch<T = unknown>(path: string, options: ApiRequestInit = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers ?? {});
  const { body, ...requestOptions } = options;
  let requestBody: BodyInit | null | undefined;

  if (!headers.has("accept")) {
    headers.set("accept", "application/json");
  }

  if (body != null && !isBodyInit(body)) {
    headers.set("content-type", "application/json");
    requestBody = JSON.stringify(body);
  } else {
    requestBody = body;
  }

  if (token && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${token}`);
  }

  const response = await fetch(path.startsWith("http") ? path : `${API_BASE_URL}${path}`, {
    ...requestOptions,
    body: requestBody,
    headers,
  });

  return parseResponse(response) as Promise<T>;
}

export const apiGet = <T = unknown>(path: string, options: Omit<ApiRequestInit, "method" | "body"> = {}) =>
  apiFetch<T>(path, { ...options, method: "GET" });
export const apiPost = <T = unknown>(path: string, body: unknown) => apiFetch<T>(path, { method: "POST", body });
export const apiPut = <T = unknown>(path: string, body: unknown) => apiFetch<T>(path, { method: "PUT", body });
export const apiDelete = <T = unknown>(path: string) => apiFetch<T>(path, { method: "DELETE" });
