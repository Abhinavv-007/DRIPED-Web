/**
 * Shared helpers for /api/admin/* endpoints.
 *
 * Driped's admin surface is intentionally tiny — a stable JSON shape that
 * lnch.in's LaunchOps can hydrate against today, before the full Phase 2
 * Cloudflare Worker backend (D1 + KV + Firebase Admin) ships. Each
 * endpoint returns a `db: "phase-2-pending"` flag in places where real
 * counts will live.
 *
 * The admin secret never crosses to the browser. lnch.in is the only
 * caller; it injects `X-Admin-Secret: $DRIPED_ADMIN_SECRET` on the
 * server side. We accept the legacy `ADMIN_SECRET` name as a fallback so
 * the same setup works for any older Pages projects that still use it.
 */

export function jsonResponse(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "private, no-store",
      ...(init.headers || {}),
    },
  });
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Returns null on success, or a 401 JSON Response the caller must return.
 * Constant-time compares the X-Admin-Secret header against
 * DRIPED_ADMIN_SECRET (or legacy ADMIN_SECRET).
 */
export function requireAdmin(request, env) {
  const expected =
    (env && (env.DRIPED_ADMIN_SECRET || env.ADMIN_SECRET)) || "";
  if (!expected) {
    return jsonResponse({ error: "admin_secret_not_configured" }, { status: 401 });
  }
  const provided = request.headers.get("x-admin-secret") || "";
  if (!provided || !safeEqual(provided, expected)) {
    return jsonResponse({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

/**
 * Stable boot timestamp + a tiny in-memory counter so repeated calls show
 * the panel is reachable. Per-instance only — Cloudflare Pages Functions
 * scale horizontally so absolute numbers shouldn't be relied on. lnch.in
 * uses these as a "is the upstream alive" signal rather than truth.
 */
function adminMetrics() {
  if (!globalThis.__dripedAdminMetrics) {
    globalThis.__dripedAdminMetrics = {
      bootedAt: Date.now(),
      adminCalls: 0,
    };
  }
  return globalThis.__dripedAdminMetrics;
}

export function bumpAdmin() {
  const m = adminMetrics();
  m.adminCalls += 1;
  return m;
}

export function readAdminMetrics() {
  return adminMetrics();
}
