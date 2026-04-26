import type { DateMatch } from './types';

/**
 * Date parsing with confidence. Supports:
 *   - 2026-05-14, 05/14/2026, 14/05/2026
 *   - May 14, 2026  |  14 May 2026  |  14th May 2026  |  14 May '26
 *   - "next billing date: ..."
 *
 * Indian receipts often use DD/MM/YYYY; US uses MM/DD/YYYY. We bias by the
 * order of day/month in the string.
 */

const MONTH_MAP: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

const RENEWAL_HINTS = /(renews? (?:on|at)|next billing (?:date|cycle)|next payment (?:on|date)?|next charge|upcoming charge|renewal date|renewal on|auto[\s-]?renews?(?: on)?|valid till|expires on)/i;
const CHARGED_HINTS = /(charged (?:on)?|paid on|order date|payment received on|processed on|transaction date|receipt date)/i;
const TRIAL_HINTS = /(trial (?:ends|expires) on|free trial ends|trial end date|trial expires)/i;

export function extractDates(text: string): {
  renewal: DateMatch | null;
  chargedAt: DateMatch | null;
  trialEnd: DateMatch | null;
} {
  return {
    renewal: pickDate(text, RENEWAL_HINTS, 'renewal'),
    chargedAt: pickDate(text, CHARGED_HINTS, 'charged_at'),
    trialEnd: pickDate(text, TRIAL_HINTS, 'trial_end'),
  };
}

function pickDate(
  text: string,
  hintRegex: RegExp,
  kind: DateMatch['kind'],
): DateMatch | null {
  // For each line / sentence containing a hint, try to parse a date nearby.
  // Split on newlines and sentence boundaries (. followed by space + cap).
  const lines = text
    .split(/\n|(?<=\.)\s+(?=[A-Z])/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (!hintRegex.test(line)) continue;
    const found = parseDateInString(line);
    if (found) {
      return { iso: found, kind, confidence: 85 };
    }
  }

  // Fallback: if no hint matched, try any date in the text at lower confidence
  if (kind === 'renewal') {
    const any = parseDateInString(text);
    if (any) return { iso: any, kind, confidence: 40 };
  }

  return null;
}

export function parseDateInString(s: string): string | null {
  // ISO 2026-05-14
  let match = s.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (match) {
    return iso(+match[1], +match[2], +match[3]);
  }

  // DD/MM/YYYY vs MM/DD/YYYY \u2014 bias by locale hint (prefer DD first for INR/EUR)
  match = s.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})\b/);
  if (match) {
    const a = +match[1];
    const b = +match[2];
    const year = expandYear(+match[3]);
    // If `a` > 12 it must be day; if `b` > 12 it must be day
    if (a > 12 && b <= 12) return iso(year, b, a);
    if (b > 12 && a <= 12) return iso(year, a, b);
    // Ambiguous \u2014 prefer DD/MM (Indian bias \u2014 we're in INR context mostly)
    return iso(year, b, a);
  }

  // "14 May 2026" / "May 14, 2026" / "14th May 2026"
  match = s.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{2,4})\b/);
  if (match) {
    const month = MONTH_MAP[match[2].toLowerCase()];
    if (month) {
      return iso(expandYear(+match[3]), month, +match[1]);
    }
  }

  match = s.match(/\b([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{2,4})\b/);
  if (match) {
    const month = MONTH_MAP[match[1].toLowerCase()];
    if (month) {
      return iso(expandYear(+match[3]), month, +match[2]);
    }
  }

  return null;
}

function iso(year: number, month: number, day: number): string | null {
  if (year < 2000 || year > 2100) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function expandYear(y: number): number {
  if (y < 70) return 2000 + y;
  if (y < 100) return 1900 + y;
  return y;
}
