import type { BillingCycle } from "@/lib/models/types";

const SUPPORTED_CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "JPY", "AUD"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

let ratesFromINR: Record<string, number> = {
  INR: 1.0,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0094,
  AED: 0.044,
  SGD: 0.016,
  JPY: 1.78,
  AUD: 0.018,
};

let ratesUpdatedAt: Date | null = null;

export const CurrencyUtil = {
  supported: SUPPORTED_CURRENCIES,

  setRates(rates: Record<string, number>, updatedAt?: Date) {
    ratesFromINR = { ...ratesFromINR, ...rates };
    ratesUpdatedAt = updatedAt ?? new Date();
  },

  get ratesUpdatedAt() {
    return ratesUpdatedAt;
  },

  ratesTimeAgo(): string {
    if (!ratesUpdatedAt) return "never";
    const diff = Date.now() - ratesUpdatedAt.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 2) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return "yesterday";
  },

  getRate(from: string, to: string): number {
    if (from === to) return 1;
    const toINR = 1 / (ratesFromINR[from] ?? 1);
    const fromINRtoTarget = ratesFromINR[to] ?? 1;
    return toINR * fromINRtoTarget;
  },

  convert(amount: number, from: string, to: string): number {
    return amount * CurrencyUtil.getRate(from, to);
  },

  symbol(code: string): string {
    const symbols: Record<string, string> = {
      INR: "₹", USD: "$", EUR: "€", GBP: "£",
      AED: "د.إ", SGD: "S$", JPY: "¥", AUD: "A$",
    };
    return symbols[code] ?? code;
  },

  formatAmount(amount: number, code: string, opts?: { compact?: boolean; decimals?: number }): string {
    const { compact = false, decimals = 0 } = opts ?? {};
    const sym = CurrencyUtil.symbol(code);

    if (compact && Math.abs(amount) >= 100000) {
      const val = amount / 100000;
      return `${sym}${val.toFixed(1)}L`;
    }
    if (compact && Math.abs(amount) >= 10000) {
      const val = amount / 1000;
      return `${sym}${val.toFixed(1)}K`;
    }

    const formatted = new Intl.NumberFormat(code === "INR" ? "en-IN" : "en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);

    return `${sym}${formatted}`;
  },

  formatContextual(amount: number, code: string, cycle: BillingCycle): string {
    const main = CurrencyUtil.formatAmount(amount, code, {
      decimals: code !== "INR" ? 2 : 0,
    });
    const suffix: Record<BillingCycle, string> = {
      weekly: "/wk", monthly: "/mo", quarterly: "/qtr", yearly: "/yr", lifetime: "",
    };
    return `${main}${suffix[cycle]}`;
  },
};

// ── Billing cycle helpers ──

export function billingCycleToMonthly(cycle: BillingCycle, amount: number): number {
  switch (cycle) {
    case "weekly": return amount * 4.345;
    case "monthly": return amount;
    case "quarterly": return amount / 3;
    case "yearly": return amount / 12;
    case "lifetime": return 0;
  }
}

export function billingCycleToYearly(cycle: BillingCycle, amount: number): number {
  switch (cycle) {
    case "weekly": return amount * 52;
    case "monthly": return amount * 12;
    case "quarterly": return amount * 4;
    case "yearly": return amount;
    case "lifetime": return 0;
  }
}

export function billingCycleLabel(cycle: BillingCycle): string {
  const labels: Record<BillingCycle, string> = {
    weekly: "Weekly", monthly: "Monthly", quarterly: "Quarterly",
    yearly: "Yearly", lifetime: "Lifetime",
  };
  return labels[cycle];
}

export function billingCycleShortSuffix(cycle: BillingCycle): string {
  const suffixes: Record<BillingCycle, string> = {
    weekly: "/wk", monthly: "/mo", quarterly: "/qtr",
    yearly: "/yr", lifetime: "",
  };
  return suffixes[cycle];
}
