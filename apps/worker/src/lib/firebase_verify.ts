const GOOGLE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

interface DecodedHeader {
  alg: string;
  kid: string;
  typ: string;
}

interface DecodedPayload {
  iss: string;
  aud: string;
  sub: string;
  email?: string;
  exp: number;
  iat: number;
  [key: string]: unknown;
}

function base64UrlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function decodeJwtPart<T>(part: string): T {
  const json = new TextDecoder().decode(base64UrlDecode(part));
  return JSON.parse(json) as T;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN CERTIFICATE-----/g, '')
    .replace(/-----END CERTIFICATE-----/g, '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function importPublicKey(pem: string): Promise<CryptoKey> {
  const certDer = pemToArrayBuffer(pem);

  // Extract the SubjectPublicKeyInfo from X.509 DER certificate
  // The SPKI starts after the outer SEQUENCE header + version + serial +
  // algorithm + issuer + validity + subject.
  // Simpler: re-export via a known PEM structure won't work in Workers.
  // Instead, use the raw X.509 cert directly — Workers support importKey
  // with 'spki' format. We need to extract the SPKI from the cert.
  const spki = extractSPKIFromCert(new Uint8Array(certDer));

  return crypto.subtle.importKey(
    'spki',
    spki,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
}

/**
 * Minimal ASN.1 DER parser to extract SubjectPublicKeyInfo from an X.509 cert.
 */
function extractSPKIFromCert(cert: Uint8Array): ArrayBuffer {
  let offset = 0;

  function readTag(): { tag: number; length: number; start: number } {
    const tag = cert[offset++];
    let length = cert[offset++];
    const start = offset;
    if (length & 0x80) {
      const numBytes = length & 0x7f;
      length = 0;
      for (let i = 0; i < numBytes; i++) {
        length = (length << 8) | cert[offset++];
      }
      return { tag, length, start: offset };
    }
    return { tag, length, start };
  }

  function skip(): void {
    const info = readTag();
    offset = info.start + info.length;
  }

  // Outer SEQUENCE (Certificate)
  readTag();
  // TBSCertificate SEQUENCE
  readTag();
  // Version [0] EXPLICIT — optional, check tag
  if (cert[offset] === 0xa0) {
    skip();
  }
  // Serial number
  skip();
  // Signature algorithm
  skip();
  // Issuer
  skip();
  // Validity
  skip();
  // Subject
  skip();

  // SubjectPublicKeyInfo — this is what we want
  const spkiStart = offset;
  const spkiInfo = readTag();
  const spkiEnd = spkiInfo.start + spkiInfo.length;

  return cert.slice(spkiStart, spkiEnd).buffer;
}

interface CachedKeys {
  keys: Record<string, string>;
  expiresAt: number;
}

async function getFirebasePublicKeys(kv: KVNamespace): Promise<Record<string, string>> {
  // Try KV cache first
  const cached = await kv.get('firebase_public_keys', 'json') as CachedKeys | null;
  if (cached && Date.now() < cached.expiresAt) {
    return cached.keys;
  }

  // Fetch fresh
  const res = await fetch(GOOGLE_CERTS_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch Firebase public keys: ${res.status}`);
  }

  const keys = await res.json() as Record<string, string>;

  // Parse Cache-Control max-age
  const cc = res.headers.get('Cache-Control') || '';
  const maxAgeMatch = cc.match(/max-age=(\d+)/);
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;

  const toCache: CachedKeys = {
    keys,
    expiresAt: Date.now() + maxAge * 1000,
  };

  await kv.put('firebase_public_keys', JSON.stringify(toCache), {
    expirationTtl: maxAge,
  });

  return keys;
}

export interface VerifiedToken {
  uid: string;
  email: string;
}

export async function verifyFirebaseToken(
  token: string,
  projectId: string,
  kv: KVNamespace,
): Promise<VerifiedToken> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  // Decode header
  const header = decodeJwtPart<DecodedHeader>(headerB64);
  if (header.alg !== 'RS256') {
    throw new Error(`Unsupported algorithm: ${header.alg}`);
  }
  if (!header.kid) {
    throw new Error('Missing kid in JWT header');
  }

  // Decode payload
  const payload = decodeJwtPart<DecodedPayload>(payloadB64);

  // Verify expiry
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    throw new Error('Token expired');
  }

  // Verify audience
  if (payload.aud !== projectId) {
    throw new Error(`Invalid audience: ${payload.aud}`);
  }

  // Verify issuer
  const expectedIssuer = `https://securetoken.google.com/${projectId}`;
  if (payload.iss !== expectedIssuer) {
    throw new Error(`Invalid issuer: ${payload.iss}`);
  }

  // Get public keys and find matching key
  const publicKeys = await getFirebasePublicKeys(kv);
  const certPem = publicKeys[header.kid];
  if (!certPem) {
    throw new Error(`No public key found for kid: ${header.kid}`);
  }

  // Import key and verify signature
  const key = await importPublicKey(certPem);
  const signedContent = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlDecode(signatureB64);

  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    signature,
    signedContent,
  );

  if (!valid) {
    throw new Error('Invalid signature');
  }

  return {
    uid: payload.sub,
    email: payload.email || '',
  };
}
