/**
 * SHA-256 hash helpers \u2014 work in browsers, Node 20+, and Cloudflare Workers.
 * Used to build stable email fingerprints + dedup keys.
 */

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const arr = new Uint8Array(digest);
  let out = '';
  for (let i = 0; i < arr.length; i++) out += arr[i].toString(16).padStart(2, '0');
  return out;
}

export async function emailFingerprint(parts: {
  subject: string;
  from: string;
  bodySnippet: string;
}): Promise<string> {
  // Keep it short but include enough to dedup identical receipts
  const canonical = [
    (parts.subject ?? '').trim(),
    (parts.from ?? '').trim().toLowerCase(),
    (parts.bodySnippet ?? '').trim().slice(0, 1200),
  ].join('\u241F');
  return (await sha256Hex(canonical)).slice(0, 32);
}

export async function subscriptionDedupKey(parts: {
  merchantSlug: string;
  amount: number | null;
  cycle: string | null;
  anchorMonth: string | null;
}): Promise<string> {
  const canonical = [
    parts.merchantSlug,
    parts.amount?.toFixed(2) ?? '?',
    parts.cycle ?? '?',
    parts.anchorMonth ?? '?',
  ].join('|');
  return (await sha256Hex(canonical)).slice(0, 16);
}
