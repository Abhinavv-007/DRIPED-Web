/**
 * GET /api/health
 *
 * Cloudflare Pages Function that runs alongside Driped's static export. The
 * full Cloudflare backend (D1 + KV + admin endpoints) is Phase 2 of the
 * lnch.in mega-project; this endpoint is the Phase 1 minimum so that
 * lnch.in's LaunchOps health probe and the public landing have a real
 * 200/JSON probe to render against.
 */
function jsonResponse(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=10, s-maxage=30",
      ...(init.headers || {}),
    },
  });
}

export async function onRequestGet({ env }) {
  return jsonResponse({
    ok: true,
    service: "driped-web",
    ts: Math.floor(Date.now() / 1000),
    version: "phase-1-public-face",
    bindings: {
      // Bindings will be populated once the Phase 2 backend is wired up;
      // for now we only declare what's actually configured.
      db: typeof env?.DB?.prepare === "function",
      kv: typeof env?.KV?.put === "function",
    },
    note: "phase-1 minimum — full backend lands in phase-2",
  });
}

export async function onRequestHead() {
  return new Response(null, {
    status: 200,
    headers: { "cache-control": "public, max-age=10" },
  });
}
