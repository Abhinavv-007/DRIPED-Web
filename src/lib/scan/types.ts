/**
 * Shared scan-engine types — used by web, worker, and Dart port (mirrored).
 */

export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'lifetime';

export type ReceiptType =
  | 'paid'
  | 'upcoming'
  | 'refund'
  | 'failed'
  | 'trial_started'
  | 'trial_ending'
  | 'canceled'
  | 'unknown';

export interface EmailInput {
  subject: string;
  from: string;
  body: string;              // HTML or plain text
  dateIso?: string | null;   // when the email was sent
  gmailMessageId?: string | null;
  gmailThreadId?: string | null;
  headers?: Record<string, string>;  // raw headers when available (DKIM, List-Unsubscribe)
}

export interface MerchantMatch {
  slug: string;
  name: string;
  confidence: number;        // 0-100
  source: 'domain' | 'header' | 'alias' | 'body_keyword' | 'ai';
}

export interface AmountMatch {
  amount: number;
  currency: string;
  confidence: number;
}

export interface DateMatch {
  iso: string;
  confidence: number;
  kind: 'renewal' | 'charged_at' | 'trial_end';
}

export interface ParsedEmail {
  merchant: MerchantMatch | null;
  amount: AmountMatch | null;
  cycle: BillingCycle | null;
  cycleConfidence: number;
  renewalDate: DateMatch | null;
  chargedAt: DateMatch | null;
  trialEndDate: DateMatch | null;
  receiptType: ReceiptType;
  overallConfidence: number;        // 0-100
  reasons: string[];
  needsReview: boolean;             // confidence < 70
  emailHash: string;
}

export interface ExtractionHint {
  preferCurrency?: string;
  preferLocale?: string;
  userCurrencyDefault?: string;
}
