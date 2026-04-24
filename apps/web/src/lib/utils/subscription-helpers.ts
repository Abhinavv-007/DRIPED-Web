import type { Subscription, BillingCycle } from "@/lib/models/types";

function addMonths(date: Date, months: number): Date {
  const totalMonths = date.getFullYear() * 12 + date.getMonth() + months;
  const year = Math.floor(totalMonths / 12);
  const month = totalMonths % 12;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const day = Math.min(date.getDate(), lastDay);
  return new Date(year, month, day);
}

function advanceCycle(date: Date, cycle: BillingCycle): Date {
  switch (cycle) {
    case "weekly":
      return new Date(date.getTime() + 7 * 86400000);
    case "monthly":
      return addMonths(date, 1);
    case "quarterly":
      return addMonths(date, 3);
    case "yearly":
      return new Date(date.getFullYear() + 1, date.getMonth(), date.getDate());
    case "lifetime":
      return date;
  }
}

export function effectiveRenewalDate(sub: Subscription): Date | null {
  if (!sub.next_renewal_date) return null;
  if (sub.billing_cycle === "lifetime") return null;

  const base = new Date(sub.next_renewal_date);
  base.setHours(0, 0, 0, 0);

  if (sub.status !== "active" && sub.status !== "trial") return base;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (base >= today) return base;

  let cursor = base;
  let guard = 0;
  while (cursor < today && guard < 120) {
    cursor = advanceCycle(cursor, sub.billing_cycle);
    guard++;
  }
  return cursor;
}

export function daysUntilRenewal(sub: Subscription): number | null {
  const effective = effectiveRenewalDate(sub);
  if (!effective) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = effective.getTime() - today.getTime();
  return Math.round(diff / 86400000);
}

export function renewalDisplayLabel(sub: Subscription): string {
  if (sub.billing_cycle === "lifetime") return "One-time";
  const days = daysUntilRenewal(sub);
  if (days === null) return "—";
  if (sub.status === "cancelled") return "Cancelled";
  if (sub.status === "archived") return "Archived";
  if (days < -30) return "Expired";
  if (days < 0) return "Overdue";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `in ${days} days`;
}

export function isGhost(sub: Subscription): boolean {
  if (sub.status !== "active") return false;
  if (!sub.last_email_detected_at) return false;
  const diff = Date.now() - new Date(sub.last_email_detected_at).getTime();
  return diff > 60 * 86400000;
}

export function isOverdue(sub: Subscription): boolean {
  return (daysUntilRenewal(sub) ?? 0) < 0;
}

export function daysUntilTrialEnd(sub: Subscription): number | null {
  if (!sub.trial_end_date) return null;
  const dt = new Date(sub.trial_end_date);
  dt.setHours(0, 0, 0, 0);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((dt.getTime() - today.getTime()) / 86400000);
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "Active",
    trial: "Trial",
    paused: "Paused",
    cancelled: "Cancelled",
    archived: "Archived",
  };
  return labels[status] ?? status;
}

export function paymentMethodTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    credit_card: "Credit Card",
    creditcard: "Credit Card",
    debit_card: "Debit Card",
    debitcard: "Debit Card",
    visa: "Visa",
    mastercard: "Mastercard",
    american_express: "American Express",
    americanexpress: "American Express",
    amex: "American Express",
    rupay: "RuPay",
    diners_club: "Diners Club",
    dinersclub: "Diners Club",
    discover: "Discover",
    maestro: "Maestro",
    upi: "UPI",
    gpay: "Google Pay",
    phonepe: "PhonePe",
    paytm: "Paytm",
    net_banking: "Net Banking",
    netbanking: "Net Banking",
    bank_transfer: "Bank Transfer",
    banktransfer: "Bank Transfer",
    paypal: "PayPal",
    apple_pay: "Apple Pay",
    amazon_pay: "Amazon Pay",
    samsung_pay: "Samsung Pay",
    wallet: "Wallet",
    crypto: "Crypto",
    bitcoin: "Bitcoin",
    binance: "Binance",
    other: "Other",
  };
  return labels[type] ?? type;
}

const CARD_PAYMENT_TYPES = new Set([
  "credit_card",
  "creditcard",
  "debit_card",
  "debitcard",
  "visa",
  "mastercard",
  "american_express",
  "americanexpress",
  "amex",
  "rupay",
  "diners_club",
  "dinersclub",
  "discover",
  "maestro",
]);

export function maskedLabel(pm: { name: string; type: string; last_four: string | null }): string {
  if (CARD_PAYMENT_TYPES.has(pm.type) && pm.last_four) return `${pm.name} •• ${pm.last_four}`;
  return pm.name;
}

export function expiryLabel(pm: { expiry_month: number | null; expiry_year: number | null }): string | null {
  if (pm.expiry_month == null || pm.expiry_year == null) return null;
  const mm = String(pm.expiry_month).padStart(2, "0");
  const yy = String(pm.expiry_year % 100).padStart(2, "0");
  return `${mm}/${yy}`;
}
