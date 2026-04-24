import type { AmountMatch } from './types';

/**
 * Amount + currency extraction. Handles INR/USD/EUR/GBP with comma grouping,
 * both "₹ 1,299.00" and "Rs. 1,299" and "$19.99" variants.
 *
 * Strategy: first match that isn't a suspiciously-large number (e.g., phone
 * numbers, order IDs). Bounded to 0.01 <= amt < 1,000,000.
 */

interface PatternResult { pattern: RegExp; currency: string; weight: number }

const PATTERNS: PatternResult[] = [
  { pattern: /\u20B9\s*([\d,]+(?:\.\d{1,2})?)/,                   currency: 'INR', weight: 1.0 },
  { pattern: /\bINR\s*([\d,]+(?:\.\d{1,2})?)/i,                   currency: 'INR', weight: 1.0 },
  { pattern: /\bRs\.?\s*([\d,]+(?:\.\d{1,2})?)/i,                 currency: 'INR', weight: 0.9 },
  { pattern: /\bRupees?\s*([\d,]+(?:\.\d{1,2})?)/i,               currency: 'INR', weight: 0.85 },

  { pattern: /\$\s*([\d,]+(?:\.\d{1,2})?)/,                       currency: 'USD', weight: 1.0 },
  { pattern: /\bUSD\s*([\d,]+(?:\.\d{1,2})?)/i,                   currency: 'USD', weight: 1.0 },
  { pattern: /US\$\s*([\d,]+(?:\.\d{1,2})?)/,                     currency: 'USD', weight: 1.0 },

  { pattern: /\u20AC\s*([\d,]+(?:\.\d{1,2})?)/,                   currency: 'EUR', weight: 1.0 },
  { pattern: /\bEUR\s*([\d,]+(?:\.\d{1,2})?)/i,                   currency: 'EUR', weight: 1.0 },

  { pattern: /\u00A3\s*([\d,]+(?:\.\d{1,2})?)/,                   currency: 'GBP', weight: 1.0 },
  { pattern: /\bGBP\s*([\d,]+(?:\.\d{1,2})?)/i,                   currency: 'GBP', weight: 1.0 },

  { pattern: /CAD\s*\$?\s*([\d,]+(?:\.\d{1,2})?)/i,               currency: 'CAD', weight: 0.9 },
  { pattern: /AUD\s*\$?\s*([\d,]+(?:\.\d{1,2})?)/i,               currency: 'AUD', weight: 0.9 },
  { pattern: /\bSGD\s*([\d,]+(?:\.\d{1,2})?)/i,                   currency: 'SGD', weight: 0.9 },
  { pattern: /\bAED\s*([\d,]+(?:\.\d{1,2})?)/i,                   currency: 'AED', weight: 0.9 },
  { pattern: /\bJPY\s*\u00A5?\s*([\d,]+(?:\.\d{1,2})?)/i,          currency: 'JPY', weight: 0.9 },
  { pattern: /\u00A5\s*([\d,]+(?:\.\d{1,2})?)/,                   currency: 'JPY', weight: 0.85 },
];

// Lines containing these hints are preferred \u2014 the amount near them is "the" amount.
const PREFERRED_CONTEXT = /\b(total|amount charged|amount due|you paid|charged|subscription|billed|auto-?renew|renewal|receipt|invoice|plan)\b/i;

export function extractAmount(text: string, preferCurrency?: string): AmountMatch | null {
  if (!text) return null;

  // Line-by-line: prefer a line that both contains context words AND a number match.
  // Split on newlines only \u2014 splitting on `.` would break decimals like `10.99`.
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);

  const candidates: Array<{ amount: number; currency: string; score: number }> = [];

  for (const line of lines) {
    const lineHasContext = PREFERRED_CONTEXT.test(line);

    for (const { pattern, currency, weight } of PATTERNS) {
      const match = pattern.exec(line);
      if (!match) continue;

      const amt = parseFloat(match[1].replace(/,/g, ''));
      if (!isFinite(amt) || amt < 0.01 || amt >= 1_000_000) continue;

      let score = 50 * weight;
      if (lineHasContext) score += 30;
      if (preferCurrency && currency === preferCurrency) score += 10;
      // Penalise weird round amounts that look like years or phone numbers
      if (amt > 1990 && amt < 2100 && !line.includes('.')) score -= 20;

      candidates.push({ amount: amt, currency, score });
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  const confidence = Math.min(100, Math.max(10, Math.round(best.score)));

  return { amount: best.amount, currency: best.currency, confidence };
}
