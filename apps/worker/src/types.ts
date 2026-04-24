import type { Context } from 'hono';

// ─── Cloudflare Bindings ───
export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  AI: Ai;                              // Workers AI binding for LLM extract
  FIREBASE_PROJECT_ID: string;
  EXCHANGE_RATE_API_KEY: string;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;               // e.g., mailto:admin@driped.in
  FCM_SERVER_KEY?: string;             // optional for Android push
}

// ─── Auth context set by middleware ───
export interface AuthUser {
  uid: string;
  email: string;
}

export type AuthContext = Context<{ Bindings: Env; Variables: { user: AuthUser } }>;

// ─── DB Row types ───
export interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  created_at: string;
}

export interface PaymentMethodRow {
  id: string;
  user_id: string;
  name: string;
  type: string;
  icon_slug: string | null;
  last_four: string | null;
  expiry_month: number | null;
  expiry_year: number | null;
  is_default: number;
  created_at: string;
}

export interface CategoryRow {
  id: string;
  user_id: string;
  name: string;
  colour_hex: string;
  icon_name: string;
  budget_limit: number | null;
  is_default: number;
  created_at: string;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  service_name: string;
  service_slug: string;
  category_id: string | null;
  amount: number;
  currency: string;
  billing_cycle: string;
  start_date: string | null;
  next_renewal_date: string | null;
  trial_end_date: string | null;
  is_trial: number;
  status: string;
  payment_method_id: string | null;
  notes: string | null;
  source: string;
  last_email_detected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentHistoryRow {
  id: string;
  user_id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  charged_at: string;
  email_subject: string | null;
  payment_method_hint: string | null;
  created_at: string;
}

export interface ScanLogRow {
  id: string;
  user_id: string;
  scan_type: string;
  emails_scanned: number;
  subscriptions_found: number;
  scanned_at: string;
}

// ─── Request bodies ───
export interface UserSyncBody {
  email: string;
  full_name?: string;
  avatar_url?: string;
  currency?: string;
}

export interface SubscriptionCreateBody {
  service_name: string;
  service_slug: string;
  category_id?: string;
  amount: number;
  currency?: string;
  billing_cycle: string;
  start_date?: string;
  next_renewal_date?: string;
  trial_end_date?: string;
  is_trial?: boolean;
  status?: string;
  payment_method_id?: string;
  notes?: string;
  source?: string;
}

export interface PaymentMethodCreateBody {
  name: string;
  type: string;
  icon_slug?: string;
  last_four?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default?: boolean;
}

export interface PaymentHistoryBulkBody {
  entries: Array<{
    subscription_id: string;
    amount: number;
    currency?: string;
    charged_at: string;
    email_subject?: string;
    payment_method_hint?: string;
  }>;
}

export interface ScanLogCreateBody {
  scan_type: string;
  emails_scanned: number;
  subscriptions_found: number;
}

// ─── Enum validators ───
export const VALID_BILLING_CYCLES = ['weekly', 'monthly', 'quarterly', 'yearly', 'lifetime'] as const;
export const VALID_STATUSES = ['active', 'trial', 'paused', 'cancelled', 'archived'] as const;
export const VALID_PM_TYPES = [
  'credit_card', 'debit_card', 'visa', 'mastercard', 'american_express',
  'amex', 'rupay', 'diners_club', 'discover', 'maestro', 'upi', 'gpay',
  'phonepe', 'paytm', 'net_banking', 'bank_transfer', 'paypal', 'apple_pay',
  'amazon_pay', 'samsung_pay', 'wallet', 'crypto', 'bitcoin', 'binance',
  'other',
] as const;
export const VALID_SCAN_TYPES = ['full', 'incremental'] as const;
export const VALID_SOURCES = ['manual', 'email_scan', 'email_auto', 'import'] as const;
export const VALID_PLATFORMS = ['web', 'android', 'ios'] as const;
export const VALID_FEEDBACK_VERDICTS = ['correct', 'wrong', 'duplicate', 'not_subscription'] as const;

// ─── V2 Row types ───
export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  platform: typeof VALID_PLATFORMS[number];
  endpoint: string;
  p256dh: string | null;
  auth_secret: string | null;
  device_label: string | null;
  last_seen_at: string;
  created_at: string;
}

export interface DeviceSessionRow {
  id: string;
  user_id: string;
  device_id: string;
  platform: typeof VALID_PLATFORMS[number];
  device_label: string | null;
  last_sync_at: string;
}

export interface UserPreferencesRow {
  user_id: string;
  theme: string;
  notify_renewal_7d: number;
  notify_renewal_3d: number;
  notify_renewal_1d: number;
  notify_trial_end: number;
  notify_price_change: number;
  notify_monthly_summary: number;
  auto_add_high_confidence: number;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
  updated_at: string;
}

export interface PriceHistoryRow {
  id: string;
  subscription_id: string;
  user_id: string;
  old_amount: number | null;
  new_amount: number;
  currency: string;
  delta_pct: number | null;
  detected_at: string;
  source: string;
}

export interface MerchantRow {
  id: string;
  slug: string;
  display_name: string;
  domains: string;           // JSON
  aliases: string | null;
  typical_cycle: string | null;
  typical_amount: number | null;
  typical_currency: string;
  category_slug: string | null;
  icon_slug: string | null;
  cancel_url: string | null;
  verified: number;
  confidence_base: number;
  updated_at: string;
}

export interface ScanFeedbackRow {
  id: string;
  user_id: string;
  email_hash: string;
  detected_slug: string | null;
  correct_slug: string | null;
  verdict: typeof VALID_FEEDBACK_VERDICTS[number];
  payload_json: string | null;
  created_at: string;
}

export interface ReceiptRefRow {
  id: string;
  user_id: string;
  subscription_id: string | null;
  email_hash: string;
  gmail_message_id: string | null;
  subject: string | null;
  sender: string | null;
  snippet: string | null;
  amount: number | null;
  currency: string | null;
  charged_at: string | null;
  created_at: string;
}

// ─── V2 Request bodies ───
export interface PushSubscribeBody {
  platform: typeof VALID_PLATFORMS[number];
  endpoint: string;
  p256dh?: string;
  auth_secret?: string;
  device_label?: string;
}

export interface ScanExtractBody {
  email_body: string;         // raw HTML or plain text
  email_subject?: string;
  email_from?: string;
  email_hash?: string;        // optional client-side sha256 for caching
  hint_merchant?: string;     // optional pre-detected merchant to boost
}

export interface ScanFeedbackBody {
  email_hash: string;
  detected_slug?: string;
  correct_slug?: string;
  verdict: typeof VALID_FEEDBACK_VERDICTS[number];
  payload?: Record<string, unknown>;
}

export interface WhatIfBody {
  cancel_subscription_ids: string[];
  target_currency?: string;
  months_ahead?: number;
}

// ─── Scan extraction AI response ───
export interface ExtractedSubscription {
  merchant_name: string | null;
  merchant_slug: string | null;
  amount: number | null;
  currency: string | null;
  billing_cycle: typeof VALID_BILLING_CYCLES[number] | null;
  next_renewal_date: string | null;
  charged_at: string | null;
  receipt_type: 'paid' | 'upcoming' | 'refund' | 'failed' | 'trial_started' | 'trial_ending' | 'canceled' | 'unknown';
  confidence: number;         // 0-100
  reasons: string[];          // explanations for UI review
}
