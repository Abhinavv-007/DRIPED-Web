/**
 * GET /api/admin/health
 *
 * Extended health check — public /api/health is intentionally terse and
 * cacheable; this admin variant includes per-instance metrics, env
 * configuration, and an explicit signal that the D1/KV wiring is still
 * pending (Phase 2). Gated by X-Admin-Secret: $DRIPED_ADMIN_SECRET.
 */
import { bumpAdmin, jsonResponse, readAdminMetrics, requireAdmin } from "./_lib.js";

export async function onRequestGet({ request, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  bumpAdmin();
  const m = readAdminMetrics();

  return jsonResponse({
    ok: true,
    service: "driped-web",
    ts: Math.floor(Date.now() / 1000),
    version: "phase-2-admin-api",
    booted_at: Math.floor(m.bootedAt / 1000),
    uptime_ms: Date.now() - m.bootedAt,
    runtime: "cloudflare-pages-functions",
    db: "phase-2-pending",
    config: {
      firebase_configured: !!(env && env.NEXT_PUBLIC_FIREBASE_API_KEY),
      admin_secret_set: !!(env && (env.DRIPED_ADMIN_SECRET || env.ADMIN_SECRET)),
    },
    bindings: {
      db: !!(env && env.DB && typeof env.DB.prepare === "function"),
      kv: !!(env && env.KV && typeof env.KV.put === "function"),
    },
    metrics: {
      admin_calls: m.adminCalls,
    },
  });
}
