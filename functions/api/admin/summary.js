/**
 * GET /api/admin/summary
 *
 * Single-shot read powering lnch.in's "Driped" panel. Returns boot/uptime
 * info, per-instance config flags, and stable empty objects for the
 * counters that land once the full Phase 2 backend (D1 + KV + Firebase
 * Admin) is wired. The shape stays stable across phases so the lnch.in
 * adapter can render the panel without crashing once real data flows in.
 */
import { bumpAdmin, jsonResponse, readAdminMetrics, requireAdmin } from "./_lib.js";

export async function onRequestGet({ request, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  bumpAdmin();
  const m = readAdminMetrics();
  const now = Date.now();

  return jsonResponse({
    service: "driped-web",
    generatedAt: Math.floor(now / 1000),
    process: {
      booted_at: Math.floor(m.bootedAt / 1000),
      uptime_ms: now - m.bootedAt,
      uptime_seconds: Math.floor((now - m.bootedAt) / 1000),
      runtime: "cloudflare-pages-functions",
    },
    config: {
      firebase_configured: !!(env && env.NEXT_PUBLIC_FIREBASE_API_KEY),
      admin_secret_set: !!(env && (env.DRIPED_ADMIN_SECRET || env.ADMIN_SECRET)),
      surface: "static-export",
    },
    db: "phase-2-pending",
    counts: {
      // Real counts (users, subscriptions, scans) hydrate once the
      // Firebase Admin SDK + D1 wiring lands. lnch.in renders honest
      // empty states off these zeros today.
      users: 0,
      subscriptions: 0,
      detected_24h: 0,
      cancelled_24h: 0,
    },
    metrics: {
      admin_calls: m.adminCalls,
    },
  });
}
