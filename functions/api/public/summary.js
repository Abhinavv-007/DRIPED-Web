/**
 * GET /api/public/summary
 *
 * Tiny placeholder summary so lnch.in's public landing has a stable shape
 * to render against. Real metrics (subscription counts, scan totals,
 * detected categories) land in Phase 2 once the D1 schema + admin API are
 * built per the original Q4 spec.
 */
function jsonResponse(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60, s-maxage=120, stale-while-revalidate=300",
      ...(init.headers || {}),
    },
  });
}

export async function onRequestGet() {
  return jsonResponse({
    service: "driped-web",
    generatedAt: Math.floor(Date.now() / 1000),
    surface: {
      static: true,
      auth: "firebase",
      // The dashboard reads its data from Firebase + Gmail OAuth today;
      // Phase 2 introduces a Cloudflare Worker-backed API so we can
      // publish real aggregate stats here.
      backend: "phase-2-pending",
    },
    counts: {},
    last24h: {},
    note: "phase-1 minimum — see lnch.in/projects/driped",
  });
}
