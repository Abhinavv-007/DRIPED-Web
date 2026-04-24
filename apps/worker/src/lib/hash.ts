/// Small hashing helpers. SHA-256 via Web Crypto.
export async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  const bytes = new Uint8Array(digest);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

/// Short, stable hash for caching keys (first 16 hex chars of sha256).
export async function cacheKeyFor(parts: string[]): Promise<string> {
  const full = await sha256Hex(parts.join('\u241F'));  // unit-separator
  return full.slice(0, 16);
}
