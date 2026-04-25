import type { ReceiptType } from './types';

/**
 * Receipt-type classifier. Distinguishes "you paid" from "we'll charge you"
 * vs refund vs trial events. Avoids treating refund emails as new subs.
 */

interface Rule { type: ReceiptType; regex: RegExp; weight: number }

const RULES: Rule[] = [
  { type: 'refund',        regex: /\b(refund(ed)?|credited back|reimburs|we'?ve refunded)\b/i, weight: 95 },
  { type: 'failed',        regex: /\b(payment (failed|declined)|could not process|unable to charge|card declined)\b/i, weight: 90 },
  { type: 'canceled',      regex: /\b(subscription (?:has been )?(?:canceled|cancelled)|your plan has been cancel|auto[- ]?renewal (?:has been )?(?:off|disabled))\b/i, weight: 90 },
  { type: 'trial_started', regex: /\b(free trial (?:has )?started|welcome to your trial|your trial (?:has )?begun)\b/i, weight: 85 },
  { type: 'trial_ending',  regex: /\b(trial (?:ends|expires|is ending)|your free trial will end)\b/i, weight: 85 },
  { type: 'upcoming',      regex: /\b(will (?:be )?charge|upcoming (?:charge|payment|invoice)|auto[- ]?renewal.*(?:in|on)|next charge (?:is )?on)\b/i, weight: 70 },
  { type: 'paid',          regex: /\b(payment (?:received|confirmed|succeeded)|paid|you'?ve been charged|receipt|invoice paid|order confirmation|thank you for your payment)\b/i, weight: 65 },
];

export function classifyReceipt(text: string): { type: ReceiptType; confidence: number } {
  let best: { type: ReceiptType; confidence: number } = { type: 'unknown', confidence: 0 };
  for (const rule of RULES) {
    if (rule.regex.test(text)) {
      if (rule.weight > best.confidence) {
        best = { type: rule.type, confidence: rule.weight };
      }
    }
  }
  return best;
}

/** Returns true if this is the kind of email we should IGNORE (not a sub event). */
export function isIgnorable(type: ReceiptType): boolean {
  return type === 'refund' || type === 'failed' || type === 'canceled';
}
