import type { MerchantMatch } from './types';
import { ALIAS_LOOKUP, DOMAIN_LOOKUP, merchantBySlug } from './merchants';

/**
 * Multi-signal merchant matcher. Highest-confidence wins.
 *
 * Signals:
 *   1. Exact sender domain match → 95
 *   2. DKIM / header domain match → 90
 *   3. Subject alias match → 75
 *   4. Body alias match → 60
 */

export function matchMerchant(input: {
  senderDomain: string | null;
  headerDomain: string | null;
  subject: string;
  body: string;
}): MerchantMatch | null {
  const candidates: MerchantMatch[] = [];

  // 1. Sender domain: try exact, then suffix. If the domain maps to several
  //    merchants (e.g., amazon.in), use subject/body to disambiguate.
  if (input.senderDomain) {
    const slugs = lookupDomain(input.senderDomain);
    const resolved = disambiguate(slugs, input.subject, input.body);
    if (resolved) {
      const m = merchantBySlug(resolved);
      if (m) candidates.push({ slug: m.slug, name: m.name, confidence: 95, source: 'domain' });
    }
  }

  // 2. Header domain
  if (input.headerDomain) {
    const slugs = lookupDomain(input.headerDomain);
    const resolved = disambiguate(slugs, input.subject, input.body);
    if (resolved) {
      const m = merchantBySlug(resolved);
      if (m) candidates.push({ slug: m.slug, name: m.name, confidence: 90, source: 'header' });
    }
  }

  // 3. Subject alias (stronger because receipt subjects mention the merchant).
  //    Collect ALL matching aliases then pick the one with the longest
  //    display name — "Amazon Prime" beats "amazon" beats "kindle".
  if (input.subject) {
    const subj = input.subject.toLowerCase();
    const hits = ALIAS_LOOKUP.filter((e) => e.regex.test(subj));
    const best = pickLongestAlias(hits);
    if (best) {
      candidates.push({ slug: best.slug, name: best.name, confidence: 75, source: 'alias' });
    }
  }

  // 4. Body keyword — same longest-match strategy.
  if (candidates.length === 0 && input.body) {
    const body = input.body.slice(0, 1500).toLowerCase();
    const hits = ALIAS_LOOKUP.filter((e) => e.regex.test(body));
    const best = pickLongestAlias(hits);
    if (best) {
      candidates.push({ slug: best.slug, name: best.name, confidence: 60, source: 'body_keyword' });
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.confidence - a.confidence);
  return candidates[0];
}

/** Pick the alias with the longest display name — most specific match. */
function pickLongestAlias(
  hits: Array<{ regex: RegExp; slug: string; name: string }>,
): { slug: string; name: string } | null {
  if (hits.length === 0) return null;
  let best = hits[0];
  for (let i = 1; i < hits.length; i++) {
    if (hits[i].name.length > best.name.length) best = hits[i];
  }
  return { slug: best.slug, name: best.name };
}

/** Exact, then suffix match. `mail.netflix.com` → `netflix.com`. May return multiple. */
function lookupDomain(domain: string): string[] {
  const d = domain.toLowerCase();
  if (DOMAIN_LOOKUP[d]) return DOMAIN_LOOKUP[d];

  for (const [key, slugs] of Object.entries(DOMAIN_LOOKUP)) {
    if (d.endsWith(`.${key}`)) return slugs;
  }
  return [];
}

/**
 * When a sender domain matches multiple merchants (e.g., amazon.in), pick the
 * one whose display-name / aliases actually appear in the subject or body.
 * Falls back to the first candidate if nothing disambiguates.
 */
function disambiguate(
  slugs: string[],
  subject: string,
  body: string,
): string | null {
  if (slugs.length === 0) return null;
  if (slugs.length === 1) return slugs[0];

  const haystack = `${subject}\n${body.slice(0, 1500)}`.toLowerCase();
  let best: { slug: string; score: number } | null = null;

  for (const slug of slugs) {
    const m = merchantBySlug(slug);
    if (!m) continue;
    const terms = [m.name.toLowerCase(), m.slug.replace(/_/g, ' '), ...(m.aliases ?? []).map((a) => a.toLowerCase())];
    let score = 0;
    for (const term of terms) {
      if (haystack.includes(term)) {
        score = Math.max(score, term.length);
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { slug, score };
    }
  }

  return best ? best.slug : slugs[0];
}
