import type { EmailInput, ExtractionHint, ParsedEmail } from './types';
import { cleanEmail, domainFromHeaders } from './email_parse';
import { matchMerchant } from './merchant_match';
import { extractAmount } from './amount';
import { extractDates } from './date';
import { detectCycle } from './cycle';
import { classifyReceipt, isIgnorable } from './classifier';
import { merchantBySlug } from './merchants';
import { emailFingerprint } from './hash';

/**
 * Multi-pass extraction. No network calls. All local. The caller decides
 * whether to also invoke the Worker's AI route for low-confidence results.
 */
export async function extractFromEmail(
  email: EmailInput,
  hint: ExtractionHint = {},
): Promise<ParsedEmail> {
  const cleaned = cleanEmail(email.body, email.from);
  const headerDomain = domainFromHeaders(email.headers);
  const reasons: string[] = [];

  const merchant = matchMerchant({
    senderDomain: cleaned.senderDomain,
    headerDomain,
    subject: email.subject,
    body: cleaned.text,
  });

  if (merchant) {
    reasons.push(`Matched ${merchant.name} via ${merchant.source}`);
  }

  const merchantSeed = merchant ? merchantBySlug(merchant.slug) : null;
  const fallbackCycle = merchantSeed?.cycle ?? null;

  const receiptClass = classifyReceipt(email.subject + '\n' + cleaned.text);

  // If this is a non-subscription event, short-circuit with receipt type
  if (isIgnorable(receiptClass.type)) {
    return {
      merchant,
      amount: null,
      cycle: null,
      cycleConfidence: 0,
      renewalDate: null,
      chargedAt: null,
      trialEndDate: null,
      receiptType: receiptClass.type,
      overallConfidence: Math.min(100, (merchant?.confidence ?? 40) + 10),
      reasons: [...reasons, `Receipt type: ${receiptClass.type}`],
      needsReview: false,
      emailHash: await emailFingerprint({
        subject: email.subject,
        from: email.from,
        bodySnippet: cleaned.text.slice(0, 1200),
      }),
    };
  }

  const amount = extractAmount(cleaned.text, hint.preferCurrency);
  if (amount) reasons.push(`Amount ${amount.currency} ${amount.amount}`);

  const cycle = detectCycle(cleaned.text, fallbackCycle);
  if (cycle.cycle) reasons.push(`Cycle: ${cycle.cycle}`);

  const dates = extractDates(cleaned.text);
  if (dates.renewal) reasons.push(`Renewal ${dates.renewal.iso}`);
  if (dates.chargedAt) reasons.push(`Charged ${dates.chargedAt.iso}`);
  if (dates.trialEnd) reasons.push(`Trial ends ${dates.trialEnd.iso}`);

  // Overall confidence = weighted average of the signals we have
  const signals: Array<{ conf: number; weight: number }> = [];
  if (merchant) signals.push({ conf: merchant.confidence, weight: 3 });
  if (amount) signals.push({ conf: amount.confidence, weight: 2 });
  if (cycle.cycle) signals.push({ conf: cycle.confidence, weight: 1 });
  if (dates.renewal || dates.chargedAt) {
    signals.push({ conf: (dates.renewal ?? dates.chargedAt)!.confidence, weight: 1 });
  }
  signals.push({ conf: receiptClass.confidence, weight: 0.5 });

  const total = signals.reduce((s, x) => s + x.weight, 0);
  const weighted = signals.reduce((s, x) => s + x.conf * x.weight, 0);
  const overallConfidence = total === 0 ? 0 : Math.round(weighted / total);

  const emailHash = await emailFingerprint({
    subject: email.subject,
    from: email.from,
    bodySnippet: cleaned.text.slice(0, 1200),
  });

  return {
    merchant,
    amount,
    cycle: cycle.cycle,
    cycleConfidence: cycle.confidence,
    renewalDate: dates.renewal,
    chargedAt: dates.chargedAt,
    trialEndDate: dates.trialEnd,
    receiptType: receiptClass.type,
    overallConfidence,
    reasons,
    needsReview: overallConfidence < 70,
    emailHash,
  };
}

/** Merge an AI-layer extraction back on top of the local pipeline result. */
export function mergeAiResult(
  local: ParsedEmail,
  ai: {
    merchant_name: string | null;
    merchant_slug: string | null;
    amount: number | null;
    currency: string | null;
    billing_cycle: string | null;
    next_renewal_date: string | null;
    charged_at: string | null;
    receipt_type: string;
    confidence: number;
    reasons: string[];
  },
): ParsedEmail {
  // AI fills gaps but never overrides high-confidence local signals.
  const merchant = local.merchant ?? (ai.merchant_slug && ai.merchant_name ? {
    slug: ai.merchant_slug, name: ai.merchant_name, confidence: ai.confidence, source: 'ai' as const,
  } : null);

  const amount = local.amount ?? (ai.amount && ai.currency ? {
    amount: ai.amount, currency: ai.currency, confidence: ai.confidence,
  } : null);

  const cycle = local.cycle ?? (
    ai.billing_cycle && ['weekly','monthly','quarterly','yearly','lifetime'].includes(ai.billing_cycle)
      ? ai.billing_cycle as ParsedEmail['cycle']
      : null
  );

  const renewalDate = local.renewalDate ?? (ai.next_renewal_date ? {
    iso: ai.next_renewal_date, confidence: ai.confidence, kind: 'renewal' as const,
  } : null);

  const chargedAt = local.chargedAt ?? (ai.charged_at ? {
    iso: ai.charged_at, confidence: ai.confidence, kind: 'charged_at' as const,
  } : null);

  const combinedConfidence = Math.round(
    (local.overallConfidence * 0.6) + (ai.confidence * 0.4),
  );

  return {
    ...local,
    merchant,
    amount,
    cycle,
    renewalDate,
    chargedAt,
    receiptType: (
      ['paid', 'upcoming', 'refund', 'failed', 'trial_started', 'trial_ending', 'canceled']
        .includes(ai.receipt_type) ? ai.receipt_type : local.receiptType
    ) as ParsedEmail['receiptType'],
    overallConfidence: combinedConfidence,
    reasons: [...local.reasons, ...ai.reasons.map((r) => `ai: ${r}`)],
    needsReview: combinedConfidence < 70,
  };
}
