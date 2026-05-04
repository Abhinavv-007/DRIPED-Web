import { getIdToken } from "@/lib/firebase";
import type { ApiResponse } from "@/lib/models/types";

// Resolution order:
//   1. NEXT_PUBLIC_WORKER_URL  (explicit override, build-time)
//   2. NODE_ENV=development    → http://localhost:8787 (wrangler dev)
//   3. otherwise               → https://api.driped.in (production)
const WORKER_URL =
  process.env.NEXT_PUBLIC_WORKER_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:8787"
    : "https://api.driped.in");

// Cloudflare Workers + D1 can spike past 8s on the first call after a cold
// start, so the previous 8s cap was hitting users on slow connections or
// after backend redeploys. 20s is generous enough for cold starts but still
// short enough that the UI gives up if something is genuinely wrong.
const DEFAULT_TIMEOUT_MS = 20_000;

const PUBLIC_PATHS = ["/currency/rates", "/push/vapid-public-key"];

function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

async function getAuthHeaders(path: string): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  // Public endpoints don't need a token. Skip the Firebase round-trip so a
  // signed-out user can still hit them (and so we don't leak a stale token).
  if (isPublicPath(path)) return headers;
  const token = await getIdToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

/** Strip undefined keys so they don't appear in the JSON body as `null`. */
function pruneBody(input: unknown): unknown {
  if (Array.isArray(input)) return input.map(pruneBody);
  if (input && typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (value === undefined) continue;
      // SQLite/D1 stores boolean-ish columns as INTEGER, and the Worker schema
      // generally typechecks `is_trial`/`is_default` as 0|1. Defensively coerce
      // booleans on these well-known columns so the Worker never rejects on a
      // body shape mismatch.
      if (
        typeof value === "boolean" &&
        (key === "is_trial" || key === "is_default")
      ) {
        out[key] = value ? 1 : 0;
      } else {
        out[key] = pruneBody(value);
      }
    }
    return out;
  }
  return input;
}

interface RequestOpts extends RequestInit {
  /** Skip the one-shot retry on transient network errors. */
  noRetry?: boolean;
  /** Override the default 20s timeout. */
  timeoutMs?: number;
}

function describeNetworkError(err: unknown, path: string): string {
  if (err instanceof Error) {
    if (err.name === "AbortError") {
      return "The server took too long to respond. Please try again.";
    }
    // `TypeError: Failed to fetch` is the browser's catch-all for CORS,
    // network down, DNS, and (in some browsers) connection-reset failures.
    // Give the user a real message instead of leaking the raw browser string.
    if (err.message === "Failed to fetch" || err.name === "TypeError") {
      return "Network error — check your internet connection and try again.";
    }
    return err.message;
  }
  return `Request to ${path} failed`;
}

async function rawRequest<T>(
  path: string,
  options: RequestOpts,
): Promise<ApiResponse<T>> {
  const headers = await getAuthHeaders(path);
  const url = `${WORKER_URL}${path}`;

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

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
      // Map common status codes to friendly messages so the UI doesn't have
      // to know about them. Devs still see the raw response in the console.
      if (typeof console !== "undefined") {
        console.error(`[api] ${options.method ?? "GET"} ${path} → ${res.status}`, json);
      }
      let error: string;
      if (typeof json.error === "string" && json.error.length > 0) {
        error = json.error;
      } else if (res.status === 401) {
        error = "Your session expired — please sign in again.";
      } else if (res.status === 403) {
        error = "You don't have permission to do that.";
      } else if (res.status === 404) {
        error = "We couldn't find what you were looking for.";
      } else if (res.status === 409) {
        error = "That looks like a duplicate — it may already exist.";
      } else if (res.status === 413) {
        error = "Request too large.";
      } else if (res.status === 429) {
        error = "Too many requests. Wait a moment and try again.";
      } else if (res.status >= 500) {
        error = "Server hiccup — please try again in a moment.";
      } else {
        error = `Request failed (${res.status})`;
      }
      return { success: false, error };
    }

    return json as ApiResponse<T>;
  } finally {
    clearTimeout(timeout);
  }
}

async function request<T>(
  path: string,
  options: RequestOpts = {},
): Promise<ApiResponse<T>> {
  try {
    return await rawRequest<T>(path, options);
  } catch (err) {
    if (typeof console !== "undefined") {
      console.error(`[api] ${options.method ?? "GET"} ${path} threw`, err);
    }
    // One-shot retry on transient network failures. D1/Workers cold starts
    // sometimes drop the first connection; a single retry after 800ms hides
    // that flicker without doubling latency for genuinely-failing requests.
    const shouldRetry =
      !options.noRetry &&
      err instanceof Error &&
      (err.name === "TypeError" || err.message === "Failed to fetch");
    if (shouldRetry) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      try {
        return await rawRequest<T>(path, { ...options, noRetry: true });
      } catch (retryErr) {
        return {
          success: false,
          error: describeNetworkError(retryErr, path),
        };
      }
    }
    return {
      success: false,
      error: describeNetworkError(err, path),
    };
  }
}

export const api = {
  get<T>(path: string, opts?: RequestOpts) {
    return request<T>(path, {
      ...opts,
      method: "GET",
      headers: { "Cache-Control": "no-cache", ...(opts?.headers ?? {}) },
    });
  },

  post<T>(path: string, body?: unknown, opts?: RequestOpts) {
    return request<T>(path, {
      ...opts,
      method: "POST",
      body: body !== undefined ? JSON.stringify(pruneBody(body)) : undefined,
    });
  },

  put<T>(path: string, body?: unknown, opts?: RequestOpts) {
    return request<T>(path, {
      ...opts,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(pruneBody(body)) : undefined,
    });
  },

  patch<T>(path: string, body?: unknown, opts?: RequestOpts) {
    return request<T>(path, {
      ...opts,
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(pruneBody(body)) : undefined,
    });
  },

  delete<T>(path: string, opts?: RequestOpts) {
    return request<T>(path, { ...opts, method: "DELETE" });
  },
};
