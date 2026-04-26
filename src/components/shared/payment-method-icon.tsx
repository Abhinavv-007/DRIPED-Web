"use client";

import { useState } from "react";
import Image from "next/image";
import { CreditCard, Landmark, WalletCards, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentVisual = {
  label: string;
  short: string;
  bg: string;
  fg: string;
  logo?: string;
  Icon?: LucideIcon;
};

const brandIcon = (fileName: string) => `/brand-icons/${fileName}`;

const PAYMENT_VISUALS: Record<string, PaymentVisual> = {
  credit_card: {
    label: "Credit Card",
    short: "CC",
    bg: "bg-white",
    fg: "text-[#1434CB]",
    logo: brandIcon("creditcard.webp"),
    Icon: CreditCard,
  },
  debit_card: {
    label: "Debit Card",
    short: "DC",
    bg: "bg-white",
    fg: "text-[#006B2B]",
    logo: brandIcon("debitcard.webp"),
    Icon: WalletCards,
  },
  visa: {
    label: "Visa",
    short: "Visa",
    bg: "bg-white",
    fg: "text-[#1434CB]",
    logo: brandIcon("visa.webp"),
  },
  mastercard: {
    label: "Mastercard",
    short: "MC",
    bg: "bg-white",
    fg: "text-[#EB001B]",
    logo: brandIcon("mastercard.webp"),
  },
  american_express: {
    label: "American Express",
    short: "AmEx",
    bg: "bg-white",
    fg: "text-[#2E77BC]",
    logo: brandIcon("americanexpress.webp"),
  },
  amex: {
    label: "American Express",
    short: "AmEx",
    bg: "bg-white",
    fg: "text-[#2E77BC]",
    logo: brandIcon("americanexpress.webp"),
  },
  rupay: {
    label: "RuPay",
    short: "RuPay",
    bg: "bg-white",
    fg: "text-[#0B4595]",
    logo: brandIcon("rupay.webp"),
  },
  diners_club: {
    label: "Diners Club",
    short: "Diners",
    bg: "bg-white",
    fg: "text-[#0079BE]",
    logo: brandIcon("dinersclub.webp"),
  },
  discover: {
    label: "Discover",
    short: "Disc",
    bg: "bg-white",
    fg: "text-[#F58220]",
    logo: brandIcon("discover.webp"),
  },
  maestro: {
    label: "Maestro",
    short: "Maestro",
    bg: "bg-white",
    fg: "text-[#005AA9]",
    logo: brandIcon("maestro.webp"),
  },
  upi: {
    label: "UPI",
    short: "UPI",
    bg: "bg-white",
    fg: "text-[#5F259F]",
    logo: brandIcon("upi.webp"),
  },
  gpay: {
    label: "Google Pay",
    short: "GPay",
    bg: "bg-white",
    fg: "text-[#4285F4]",
    logo: brandIcon("googlepay.svg"),
  },
  phonepe: {
    label: "PhonePe",
    short: "PP",
    bg: "bg-white",
    fg: "text-[#5F259F]",
    logo: brandIcon("phonepe.webp"),
  },
  paytm: {
    label: "Paytm",
    short: "Paytm",
    bg: "bg-white",
    fg: "text-[#00BAF2]",
    logo: brandIcon("paytm.webp"),
  },
  net_banking: {
    label: "Net Banking",
    short: "NB",
    bg: "bg-[#FFE0D0]",
    fg: "text-[#7A2B00]",
    Icon: Landmark,
  },
  bank_transfer: {
    label: "Bank Transfer",
    short: "Bank",
    bg: "bg-white",
    fg: "text-[#3F3F46]",
    logo: brandIcon("banktransfer.webp"),
  },
  paypal: {
    label: "PayPal",
    short: "PP",
    bg: "bg-white",
    fg: "text-[#003087]",
    logo: brandIcon("paypal.webp"),
  },
  apple_pay: {
    label: "Apple Pay",
    short: "Apple",
    bg: "bg-white",
    fg: "text-[#111111]",
    logo: brandIcon("applepay.svg"),
  },
  amazon_pay: {
    label: "Amazon Pay",
    short: "Amazon",
    bg: "bg-white",
    fg: "text-[#00A8E1]",
    logo: brandIcon("amazonpay.svg"),
  },
  samsung_pay: {
    label: "Samsung Pay",
    short: "Samsung",
    bg: "bg-white",
    fg: "text-[#1428A0]",
    logo: brandIcon("samsungpay.webp"),
  },
  wallet: {
    label: "Wallet",
    short: "Wallet",
    bg: "bg-white",
    fg: "text-[#5B5F97]",
    logo: brandIcon("wallet.webp"),
    Icon: WalletCards,
  },
  crypto: {
    label: "Crypto",
    short: "Crypto",
    bg: "bg-white",
    fg: "text-[#F7931A]",
    logo: brandIcon("btc.webp"),
  },
  bitcoin: {
    label: "Bitcoin",
    short: "BTC",
    bg: "bg-white",
    fg: "text-[#F7931A]",
    logo: brandIcon("btc.webp"),
  },
  binance: {
    label: "Binance",
    short: "BNB",
    bg: "bg-white",
    fg: "text-[#F0B90B]",
    logo: brandIcon("binance.webp"),
  },
  other: {
    label: "Other",
    short: "Pay",
    bg: "bg-muted",
    fg: "text-muted-foreground",
    Icon: WalletCards,
  },
};

const PAYMENT_KEY_ALIASES: Record<string, string> = {
  creditcard: "credit_card",
  debitcard: "debit_card",
  americanexpress: "american_express",
  dinersclub: "diners_club",
  googlepay: "gpay",
  banktransfer: "bank_transfer",
  applepay: "apple_pay",
  amazonpay: "amazon_pay",
  samsungpay: "samsung_pay",
  btc: "bitcoin",
  binancepay: "binance",
};

function normalizePaymentKey(value?: string | null): string | null {
  if (!value) return null;
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return PAYMENT_KEY_ALIASES[normalized] ?? normalized;
}

export function getPaymentMethodVisual(type: string, iconSlug?: string | null): PaymentVisual {
  const iconKey = normalizePaymentKey(iconSlug);
  const typeKey = normalizePaymentKey(type) ?? type;
  return (iconKey && PAYMENT_VISUALS[iconKey]) || PAYMENT_VISUALS[typeKey] || PAYMENT_VISUALS.other;
}

export function PaymentMethodIcon({
  type,
  iconSlug,
  size = 40,
  className,
  shadow = true,
}: {
  type: string;
  iconSlug?: string | null;
  size?: number;
  className?: string;
  shadow?: boolean;
}) {
  const visual = getPaymentMethodVisual(type, iconSlug);
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const hasLogo = Boolean(visual.logo && failedLogo !== visual.logo);
  const Icon = visual.Icon;

  return (
    <div
      title={visual.label}
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-foreground/80 font-black",
        visual.bg,
        visual.fg,
        className
      )}
      style={{
        width: size,
        height: size,
        boxShadow: shadow ? "2px 2px 0px var(--foreground)" : undefined,
        fontSize: Math.max(10, size * 0.24),
      }}
    >
      {hasLogo ? (
        <Image
          src={visual.logo!}
          alt={visual.label}
          width={Math.round(size * 0.68)}
          height={Math.round(size * 0.68)}
          className="object-contain"
          onError={() => setFailedLogo(visual.logo ?? null)}
          unoptimized
        />
      ) : Icon ? (
        <Icon className="size-[52%]" strokeWidth={2.1} />
      ) : (
        <span className="leading-none">{visual.short}</span>
      )}
    </div>
  );
}
