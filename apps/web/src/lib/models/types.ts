// ── Enums ──

export type BillingCycle = "weekly" | "monthly" | "quarterly" | "yearly" | "lifetime";
export type SubscriptionStatus = "active" | "trial" | "paused" | "cancelled" | "archived";
export type SubscriptionSource = "manual" | "email_scan" | "email_auto" | "import";
export type PaymentMethodType =
  | "credit_card"
  | "debit_card"
  | "visa"
  | "mastercard"
  | "american_express"
  | "amex"
  | "rupay"
  | "diners_club"
  | "discover"
  | "maestro"
  | "upi"
  | "gpay"
  | "phonepe"
  | "paytm"
  | "net_banking"
  | "bank_transfer"
  | "paypal"
  | "apple_pay"
  | "amazon_pay"
  | "samsung_pay"
  | "wallet"
  | "crypto"
  | "bitcoin"
  | "binance"
  | "other";

// ── Core Models ──

export interface AppUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  service_name: string;
  service_slug: string;
  category_id: string | null;
  amount: number;
  currency: string;
  billing_cycle: BillingCycle;
  start_date: string | null;
  next_renewal_date: string | null;
  trial_end_date: string | null;
  is_trial: number;
  status: SubscriptionStatus;
  payment_method_id: string | null;
  notes: string | null;
  source: SubscriptionSource;
  last_email_detected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  name: string;
  type: PaymentMethodType;
  icon_slug: string | null;
  last_four: string | null;
  expiry_month: number | null;
  expiry_year: number | null;
  is_default: number;
  created_at: string;
}

export interface AppCategory {
  id: string;
  user_id: string;
  name: string;
  slug?: string;
  colour_hex: string;
  icon_name: string;
  budget_limit: number | null;
  is_default: number;
  created_at?: string;
}

export interface PaymentHistoryEntry {
  id: string;
  user_id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  charged_at: string;
  email_subject: string | null;
  payment_method_hint: string | null;
  created_at?: string;
}

export interface ScanLog {
  id: string;
  user_id: string;
  scan_type: string;
  emails_scanned: number;
  subscriptions_found: number;
  scanned_at: string;
}

// ── Dashboard computed types ──

export interface DashboardSummary {
  monthlyTotal: number;
  yearlyTotal: number;
  activeCount: number;
  trialsEndingSoon: number;
}

export interface CategorySlice {
  category: AppCategory;
  totalMonthly: number;
  subCount: number;
}

export interface MonthlySpendPoint {
  month: string;
  total: number;
}

// ── API response wrapper ──

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ── Form types ──

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
  last_email_detected_at?: string;
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
