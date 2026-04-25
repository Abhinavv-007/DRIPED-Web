import type { BillingCycle } from './types';

/**
 * Billing cycle detection. Works off keywords in the body and (fallback)
 * the merchant's typical cycle.
 */

const PATTERNS: Array<{ cycle: BillingCycle; regex: RegExp; weight: number }> = [
  { cycle: 'lifetime',  regex: /\b(one[-\s]?time|lifetime|single[\s-]?payment)\b/i,  weight: 90 },
  { cycle: 'yearly',    regex: /\b(annual(?:ly)?|yearly|per\s+year|\/year|\/yr|12[\s-]?months?)\b/i, weight: 85 },
  { cycle: 'quarterly', regex: /\b(quarterly|every\s+3\s+months|3[\s-]?months?\s+plan)\b/i, weight: 80 },
  { cycle: 'monthly',   regex: /\b(monthly|per\s+month|\/month|\/mo|every\s+month)\b/i, weight: 70 },
  { cycle: 'weekly',    regex: /\b(weekly|per\s+week|\/week|\/wk|every\s+week)\b/i, weight: 70 },
];

export function detectCycle(
  text: string,
  fallback: BillingCycle | null = null,
): { cycle: BillingCycle | null; confidence: number } {
  for (const { cycle, regex, weight } of PATTERNS) {
    if (regex.test(text)) return { cycle, confidence: weight };
  }
  if (fallback) return { cycle: fallback, confidence: 40 };
  return { cycle: null, confidence: 0 };
}
