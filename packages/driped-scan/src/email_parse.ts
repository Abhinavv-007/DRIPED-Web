/**
 * HTML + header parsing helpers \u2014 work everywhere (no DOMParser dependency).
 */

export interface CleanedEmail {
  text: string;
  senderDomain: string | null;
  senderEmail: string | null;
}

const HTML_TAG_RE = /<[^>]+>/g;
const STYLE_RE = /<style[\s\S]*?<\/style>/gi;
const SCRIPT_RE = /<script[\s\S]*?<\/script>/gi;
const HEAD_RE = /<head[\s\S]*?<\/head>/gi;
const WHITESPACE_RE = /\s+/g;

const HTML_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;':  '&',
  '&lt;':   '<',
  '&gt;':   '>',
  '&quot;': '"',
  '&apos;': "'",
  '&rsquo;': '\u2019',
  '&lsquo;': '\u2018',
  '&rdquo;': '\u201D',
  '&ldquo;': '\u201C',
  '&mdash;': '\u2014',
  '&ndash;': '\u2013',
  '&hellip;': '\u2026',
  '&pound;': '\u00A3',
  '&euro;':  '\u20AC',
  '&cent;':  '\u00A2',
  '&yen;':   '\u00A5',
  '&rupee;': '\u20B9',
};

/** Strip HTML, resolve entities, collapse whitespace, cap length. */
export function htmlToText(body: string, maxLen = 8000): string {
  if (!body) return '';
  let text = body
    .replace(SCRIPT_RE, ' ')
    .replace(STYLE_RE, ' ')
    .replace(HEAD_RE, ' ')
    .replace(HTML_TAG_RE, ' ');

  text = text.replace(/&#(\d+);/g, (_m, num) => {
    const code = parseInt(num, 10);
    return Number.isFinite(code) ? String.fromCharCode(code) : '';
  });
  text = text.replace(/&#x([0-9a-f]+);/gi, (_m, hex) => {
    const code = parseInt(hex, 16);
    return Number.isFinite(code) ? String.fromCharCode(code) : '';
  });

  for (const [entity, char] of Object.entries(HTML_ENTITIES)) {
    text = text.split(entity).join(char);
  }

  text = text.replace(WHITESPACE_RE, ' ').trim();
  return text.length > maxLen ? text.slice(0, maxLen) : text;
}

/** Extract display email + domain from `"Name" <addr@host.com>` or plain. */
export function parseFromAddress(raw: string): { email: string | null; domain: string | null } {
  if (!raw) return { email: null, domain: null };
  const match = raw.match(/<([^>]+)>/);
  const email = (match ? match[1] : raw).trim().toLowerCase();
  const at = email.indexOf('@');
  if (at < 0) return { email: email || null, domain: null };
  return { email, domain: email.slice(at + 1) };
}

export function cleanEmail(
  body: string,
  from: string,
): CleanedEmail {
  const text = htmlToText(body);
  const { email, domain } = parseFromAddress(from);
  return { text, senderEmail: email, senderDomain: domain };
}

/** Extract the best-guess merchant domain from DKIM signature / List-Unsubscribe headers. */
export function domainFromHeaders(headers?: Record<string, string>): string | null {
  if (!headers) return null;

  const dkim = headers['dkim-signature'] ?? headers['DKIM-Signature'];
  if (dkim) {
    const match = dkim.match(/d=([^;\s]+)/i);
    if (match) return match[1].toLowerCase();
  }

  const listUnsub = headers['list-unsubscribe'] ?? headers['List-Unsubscribe'];
  if (listUnsub) {
    const match = listUnsub.match(/https?:\/\/([^\/\s<>,]+)/);
    if (match) return match[1].toLowerCase();
  }

  return null;
}
