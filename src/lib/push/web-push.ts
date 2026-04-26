"use client";

import { api } from "@/lib/api/client";

export type PushPermission = "default" | "granted" | "denied" | "unsupported";

/** Detect whether the browser supports Web Push at all. */
export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getPermissionState(): PushPermission {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission as PushPermission;
}

/** Register the service worker (once). */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  try {
    // `scope: "/"` so the SW handles push for every page
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch (err) {
    console.error("[push] SW register failed", err);
    return null;
  }
}

/** Fetch the Worker's VAPID public key. Public route \u2014 no auth. */
async function fetchVapidKey(): Promise<Uint8Array<ArrayBuffer> | null> {
  const res = await api.get<{ key: string }>("/push/vapid-public-key");
  if (!res.success || !res.data?.key) return null;
  return urlBase64ToUint8(res.data.key);
}

/** Race a promise against a timeout so the UI never gets stuck. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(
      () =>
        reject(
          new Error(
            `${label} timed out after ${Math.round(ms / 1000)}s. Please try again.`,
          ),
        ),
      ms,
    );
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

/**
 * Ask for permission + subscribe. Returns the endpoint on success.
 * Every step is bounded by a timeout so the UI never stays on "Enabling\u2026"
 * forever (e.g. when the user dismisses the browser prompt without choosing).
 */
export async function enablePush(deviceLabel?: string): Promise<{
  ok: boolean;
  error?: string;
  endpoint?: string;
}> {
  if (!isPushSupported()) return { ok: false, error: "Push not supported in this browser" };

  // 1. Permission (prompt can hang if user ignores it \u2014 15s cap)
  let permission: NotificationPermission;
  try {
    const permPromise = Promise.resolve(Notification.requestPermission());
    permission = await withTimeout(permPromise, 15_000, "Permission prompt");
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
  if (permission === "denied") {
    return { ok: false, error: "Notifications blocked \u2014 re-allow in your browser site settings." };
  }
  if (permission !== "granted") {
    return { ok: false, error: "Permission not granted" };
  }

  // 2. Service worker (some browsers are slow on first register \u2014 12s cap)
  let reg: ServiceWorkerRegistration | null;
  try {
    reg = await withTimeout(registerServiceWorker(), 12_000, "Service worker");
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
  if (!reg) return { ok: false, error: "Service worker registration failed" };

  let ready: ServiceWorkerRegistration;
  try {
    ready = await withTimeout(navigator.serviceWorker.ready, 12_000, "Service worker");
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }

  // 3. VAPID key (server may be cold \u2014 10s cap)
  let key: Uint8Array<ArrayBuffer> | null;
  try {
    key = await withTimeout(fetchVapidKey(), 10_000, "VAPID key");
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
  if (!key) {
    return {
      ok: false,
      error:
        "Server not configured for push yet. Ask the admin to set VAPID_PUBLIC_KEY.",
    };
  }

  // 4. Subscribe
  let sub: PushSubscription;
  try {
    sub = await withTimeout(
      ready.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key,
      }),
      15_000,
      "Subscribe",
    );
  } catch (err) {
    return { ok: false, error: `Subscribe failed: ${(err as Error).message}` };
  }

  const json = sub.toJSON();
  const p256dh = (json.keys?.p256dh as string) ?? "";
  const auth = (json.keys?.auth as string) ?? "";
  if (!p256dh || !auth) {
    return { ok: false, error: "Missing subscription keys" };
  }

  // 5. Register on server
  const label = deviceLabel ?? detectDeviceLabel();
  const post = await api.post<{ id: string }>("/push/subscribe", {
    platform: "web",
    endpoint: sub.endpoint,
    p256dh,
    auth_secret: auth,
    device_label: label,
  });

  if (!post.success) {
    // Roll back the browser subscription so we don't leave a dangling endpoint
    try {
      await sub.unsubscribe();
    } catch {
      /* ignore */
    }
    return { ok: false, error: post.error ?? "Server rejected subscription" };
  }

  return { ok: true, endpoint: sub.endpoint };
}

/** Remove the current browser's push subscription + unregister on server. */
export async function disablePush(): Promise<{ ok: boolean; error?: string }> {
  if (!isPushSupported()) return { ok: true };

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return { ok: true };

    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    await api.delete(`/push/subscribe?endpoint=${encodeURIComponent(endpoint)}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/** Whether the current browser already has an active subscription. */
export async function isCurrentlySubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const reg = await withTimeout(navigator.serviceWorker.ready, 5_000, "Service worker ready check");
    const sub = await withTimeout(reg.pushManager.getSubscription(), 5_000, "Subscription check");
    return sub != null;
  } catch {
    return false;
  }
}

// ─── Helpers ───

function detectDeviceLabel(): string {
  if (typeof navigator === "undefined") return "Unknown device";
  const ua = navigator.userAgent;
  const browser =
    /Edg\//.test(ua) ? "Edge" :
    /Chrome\//.test(ua) ? "Chrome" :
    /Firefox\//.test(ua) ? "Firefox" :
    /Safari\//.test(ua) ? "Safari" : "Browser";
  const os =
    /Windows/.test(ua) ? "Windows" :
    /Macintosh|Mac OS X/.test(ua) ? "Mac" :
    /Android/.test(ua) ? "Android" :
    /iPhone|iPad/.test(ua) ? "iOS" :
    /Linux/.test(ua) ? "Linux" : "Device";
  return `${browser} on ${os}`;
}

/**
 * Build a Uint8Array that is guaranteed to be backed by a plain ArrayBuffer
 * (not a SharedArrayBuffer) so it satisfies the `BufferSource` type of
 * `applicationServerKey`.
 */
function urlBase64ToUint8(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
