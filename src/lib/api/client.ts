import { getIdToken } from "@/lib/firebase";
import type { ApiResponse } from "@/lib/models/types";

// Resolution order:
//   1. NEXT_PUBLIC_WORKER_URL  (explicit override, build-time)
//   2. NODE_ENV=development    \u2192 http://localhost:8787 (wrangler dev)
//   3. otherwise               \u2192 https://api.driped.in (production)
const WORKER_URL =
  process.env.NEXT_PUBLIC_WORKER_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:8787"
    : "https://api.driped.in");

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getIdToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const headers = await getAuthHeaders();
  const url = `${WORKER_URL}${path}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...headers,
        ...(options?.headers ?? {}),
      },
    });

    const text = await res.text();
    let json: ApiResponse<T> | Record<string, unknown> = {};
    if (text) {
      try {
        json = JSON.parse(text) as ApiResponse<T> | Record<string, unknown>;
      } catch {
        json = { success: false, error: text };
      }
    }

    if (!res.ok) {
      const error = typeof json.error === "string" ? json.error : `Request failed (${res.status})`;
      return {
        success: false,
        error,
      };
    }

    return json as ApiResponse<T>;
  } catch (err) {
    const message = err instanceof Error
      ? err.name === "AbortError" ? "Request timed out" : err.message
      : "Network error";
    return { success: false, error: message };
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  get<T>(path: string) {
    return request<T>(path, {
      method: "GET",
      headers: { "Cache-Control": "no-cache" },
    });
  },

  post<T>(path: string, body?: unknown) {
    return request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(path: string, body?: unknown) {
    return request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(path: string) {
    return request<T>(path, { method: "DELETE" });
  },
};
