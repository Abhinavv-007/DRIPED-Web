/// Minimal VAPID Web Push client for Cloudflare Workers.
///
/// We implement the spec directly because npm `web-push` pulls node-only deps.
/// RFC 8291 / 8292 / 8188 \u2014 we generate the VAPID JWT, encrypt the payload
/// with aes128gcm, and POST to the endpoint.

import type { Env } from '../types';

export interface PushPayload {
  title: string;
  body: string;
  tag?: string;
  url?: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
}

export interface WebPushSubscription {
  endpoint: string;
  p256dh: string;   // base64url
  auth: string;     // base64url
}

/** Send a notification to a single web-push subscription. */
export async function sendWebPush(
  env: Env,
  subscription: WebPushSubscription,
  payload: PushPayload,
): Promise<{ ok: boolean; status: number; body?: string }> {
  const origin = new URL(subscription.endpoint).origin;
  const jwt = await buildVapidJwt(env, origin);

  const bodyJson = JSON.stringify(payload);
  const encrypted = await encryptPayload(bodyJson, subscription.p256dh, subscription.auth);

  const res = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `vapid t=${jwt}, k=${env.VAPID_PUBLIC_KEY}`,
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      'TTL': '86400',
      'Urgency': 'normal',
    },
    body: encrypted,
  });

  if (res.ok) return { ok: true, status: res.status };
  const text = await res.text().catch(() => '');
  return { ok: false, status: res.status, body: text };
}

/** Send an FCM-style notification to an Android device. */
export async function sendFcm(
  env: Env,
  token: string,
  payload: PushPayload,
): Promise<{ ok: boolean; status: number; body?: string }> {
  if (!env.FCM_SERVER_KEY) {
    return { ok: false, status: 0, body: 'FCM not configured' };
  }
  const res = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Authorization': `key=${env.FCM_SERVER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: token,
      notification: {
        title: payload.title,
        body: payload.body,
        tag: payload.tag,
      },
      data: {
        url: payload.url ?? '',
        ...payload.data,
      },
    }),
  });
  if (res.ok) return { ok: true, status: res.status };
  const text = await res.text().catch(() => '');
  return { ok: false, status: res.status, body: text };
}

// ─── VAPID JWT ───
async function buildVapidJwt(env: Env, audience: string): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: env.VAPID_SUBJECT || 'mailto:admin@driped.in',
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const toSign = `${encodedHeader}.${encodedPayload}`;

  const privateKey = await importVapidPrivateKey(env.VAPID_PRIVATE_KEY);
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(toSign),
  );

  // ECDSA Web Crypto signatures are fixed-size (r || s), 64 bytes for P-256 \u2014
  // which is already the JOSE format. Output as-is.
  return `${toSign}.${base64UrlEncodeBytes(new Uint8Array(signature))}`;
}

/**
 * Accepts the VAPID private key in two shapes:
 *   1. Base64url-encoded JWK JSON (what `ops/deploy/gen-vapid.mjs` produces).
 *   2. Plain JWK JSON string.
 */
async function importVapidPrivateKey(privateKeyMaterial: string): Promise<CryptoKey> {
  const trimmed = privateKeyMaterial.trim();
  let jwk: JsonWebKey;

  if (trimmed.startsWith('{')) {
    // Plain JSON
    jwk = JSON.parse(trimmed) as JsonWebKey;
  } else {
    // base64url(JSON)
    const decoded = new TextDecoder().decode(base64UrlDecode(trimmed));
    jwk = JSON.parse(decoded) as JsonWebKey;
  }

  if (jwk.kty !== 'EC' || jwk.crv !== 'P-256' || !jwk.d) {
    throw new Error('VAPID_PRIVATE_KEY must be an EC P-256 JWK with a `d` component');
  }

  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
}

// ─── base64url helpers ───
function base64UrlEncode(str: string): string {
  return base64UrlEncodeBytes(new TextEncoder().encode(str));
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(input: string): Uint8Array {
  const padded = input + '==='.slice((input.length + 3) % 4);
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ─── aes128gcm payload encryption ───
// Full RFC 8291 flow. Complex; we ship a minimal correct implementation.
async function encryptPayload(
  plaintext: string,
  p256dhBase64Url: string,
  authBase64Url: string,
): Promise<ArrayBuffer> {
  const recipientPublic = base64UrlDecode(p256dhBase64Url);
  const authSecret = base64UrlDecode(authBase64Url);

  // Generate an ephemeral ECDH keypair
  const ephemeral = (await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true, ['deriveBits'],
  )) as CryptoKeyPair;
  const ephemeralPublicRaw = new Uint8Array(
    (await crypto.subtle.exportKey('raw', ephemeral.publicKey)) as ArrayBuffer,
  );

  // Import recipient public key as ECDH
  const recipientKey = await crypto.subtle.importKey(
    'raw', recipientPublic as unknown as ArrayBuffer,
    { name: 'ECDH', namedCurve: 'P-256' },
    false, [],
  );

  // Derive shared secret (Workers' type decl quirk — `public` is the right name)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: recipientKey } as any,
    ephemeral.privateKey,
    256,
  );

  // HKDF: ikm = sharedSecret, salt = authSecret, info = key_info + recipientPublic + ephemeralPublic
  const keyInfo = concat(
    new TextEncoder().encode('WebPush: info\0'),
    recipientPublic,
    ephemeralPublicRaw,
  );
  const ikm = await hkdf(new Uint8Array(sharedBits), authSecret, keyInfo, 32);

  // Salt for content key
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Derive content encryption key (CEK) and nonce
  const cekInfo = new TextEncoder().encode('Content-Encoding: aes128gcm\0');
  const nonceInfo = new TextEncoder().encode('Content-Encoding: nonce\0');
  const cek = await hkdf(ikm, salt, cekInfo, 16);
  const nonce = await hkdf(ikm, salt, nonceInfo, 12);

  // Pad: RFC 8188 delimiter 0x02 + fill
  const plaintextBytes = new TextEncoder().encode(plaintext);
  const padded = new Uint8Array(plaintextBytes.length + 1);
  padded.set(plaintextBytes, 0);
  padded[plaintextBytes.length] = 0x02;

  const cekKey = await crypto.subtle.importKey(
    'raw', cek,
    { name: 'AES-GCM' },
    false, ['encrypt'],
  );
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce },
      cekKey,
      padded,
    ),
  );

  // Build output: salt(16) || rs(4) || idlen(1) || keyid(keyidlen) || ciphertext
  // rs = 4096 (record size), idlen = 65 (ephemeralPublic), keyid = ephemeralPublic
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096);
  const idlen = new Uint8Array([ephemeralPublicRaw.length]);

  const out = concat(salt, rs, idlen, ephemeralPublicRaw, ciphertext);
  // Copy into a fresh ArrayBuffer to avoid SharedArrayBuffer type mismatch
  const buf = new ArrayBuffer(out.length);
  new Uint8Array(buf).set(out);
  return buf;
}

async function hkdf(ikm: Uint8Array, salt: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw', ikm,
    { name: 'HKDF' },
    false, ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}
