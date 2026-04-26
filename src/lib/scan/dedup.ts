import type { ParsedEmail } from './types';
import { subscriptionDedupKey } from './hash';

/**
 * Given a list of ParsedEmail across a full Gmail scan, collapse them into
 * unique subscriptions. The key is (merchant_slug, amount-rounded, cycle,
 * anchor-month-of-year) so receipts across months still merge.
 */
export interface AggregatedSubscription {
  key: string;
  merchantSlug: string;
  merchantName: string;
  amount: number | null;
  currency: string | null;
  cycle: ParsedEmail['cycle'];
  lastChargedAt: string | null;
  nextRenewalDate: string | null;
  trialEndDate: string | null;
  receiptCount: number;
  confidence: number;
  reasons: string[];
  emailHashes: string[];
}

export async function aggregate(parsed: ParsedEmail[]): Promise<AggregatedSubscription[]> {
  const bySlug = new Map<string, AggregatedSubscription>();

  for (const p of parsed) {
    if (!p.merchant || p.receiptType === 'refund' || p.receiptType === 'failed') continue;

    // anchor-month: use renewal date > charged date > unknown
    const anchor = p.renewalDate?.iso ?? p.chargedAt?.iso ?? null;
    const anchorMonth = anchor ? anchor.slice(0, 7) : null;

    const key = await subscriptionDedupKey({
      merchantSlug: p.merchant.slug,
      amount: p.amount?.amount ?? null,
      cycle: p.cycle,
      anchorMonth,
    });

    const existing = bySlug.get(key);
    if (!existing) {
      bySlug.set(key, {
        key,
        merchantSlug: p.merchant.slug,
        merchantName: p.merchant.name,
        amount: p.amount?.amount ?? null,
        currency: p.amount?.currency ?? null,
        cycle: p.cycle,
        lastChargedAt: p.chargedAt?.iso ?? null,
        nextRenewalDate: p.renewalDate?.iso ?? null,
        trialEndDate: p.trialEndDate?.iso ?? null,
        receiptCount: 1,
        confidence: p.overallConfidence,
        reasons: [...p.reasons],
        emailHashes: [p.emailHash],
      });
    } else {
      existing.receiptCount += 1;
      existing.confidence = Math.max(existing.confidence, p.overallConfidence);
      existing.emailHashes.push(p.emailHash);
      // Keep most recent charged_at
      if (p.chargedAt?.iso && (!existing.lastChargedAt || p.chargedAt.iso > existing.lastChargedAt)) {
        existing.lastChargedAt = p.chargedAt.iso;
      }
      // Keep soonest future renewal date
      if (p.renewalDate?.iso) {
        if (!existing.nextRenewalDate || p.renewalDate.iso > existing.nextRenewalDate) {
          existing.nextRenewalDate = p.renewalDate.iso;
        }
      }
      if (p.trialEndDate?.iso) existing.trialEndDate = p.trialEndDate.iso;
    }
  }

  return Array.from(bySlug.values()).sort((a, b) => b.confidence - a.confidence);
}
