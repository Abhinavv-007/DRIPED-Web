/**
 * GET /api/admin/audit
 *
 * Process-level event feed. Driped is currently stateless on the admin
 * read side (Firebase Admin + D1 wiring lands in Phase 2), so the audit
 * feed surfaces boot events and counts of admin calls. lnch.in composes
 * its own audit timeline from its probe history; this is a placeholder
 * that proves the upstream is reachable.
 */
import { bumpAdmin, jsonResponse, readAdminMetrics, requireAdmin } from "./_lib.js";

export async function onRequestGet({ request, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  bumpAdmin();
  const m = readAdminMetrics();
  const now = Math.floor(Date.now() / 1000);

  return jsonResponse({
    service: "driped-web",
    generatedAt: now,
    db: "phase-2-pending",
    events: [
      {
        type: "process.boot",
        ts: Math.floor(m.bootedAt / 1000),
        details: { runtime: "cloudflare-pages-functions" },
      },
      {
        type: "admin.call",
        ts: now,
        details: { total: m.adminCalls },
      },
    ],
  });
}
