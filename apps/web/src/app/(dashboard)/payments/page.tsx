"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Plus,
  Wallet,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IllustratedEmptyState } from "@/components/shared/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePaymentMethods, useCreatePaymentMethod } from "@/lib/hooks/use-payment-methods";
import { useSubscriptions } from "@/lib/hooks/use-subscriptions";
import { useAppStore } from "@/lib/stores/app-store";
import { CurrencyUtil, billingCycleToMonthly } from "@/lib/utils/currency";
import {
  paymentMethodTypeLabel,
  maskedLabel,
  expiryLabel,
} from "@/lib/utils/subscription-helpers";
import { PaymentMethodIcon } from "@/components/shared/payment-method-icon";
import { toast } from "sonner";
import type { PaymentMethodType } from "@/lib/models/types";

const PM_TYPES: { value: PaymentMethodType; label: string }[] = [
  { value: "credit_card", label: "Credit Card" },
  { value: "debit_card", label: "Debit Card" },
  { value: "visa", label: "Visa" },
  { value: "mastercard", label: "Mastercard" },
  { value: "american_express", label: "AmEx" },
  { value: "rupay", label: "RuPay" },
  { value: "diners_club", label: "Diners" },
  { value: "discover", label: "Discover" },
  { value: "maestro", label: "Maestro" },
  { value: "upi", label: "UPI" },
  { value: "gpay", label: "Google Pay" },
  { value: "phonepe", label: "PhonePe" },
  { value: "paytm", label: "Paytm" },
  { value: "net_banking", label: "Net Banking" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "paypal", label: "PayPal" },
  { value: "apple_pay", label: "Apple Pay" },
  { value: "amazon_pay", label: "Amazon Pay" },
  { value: "samsung_pay", label: "Samsung Pay" },
  { value: "wallet", label: "Wallet" },
  { value: "crypto", label: "Crypto" },
  { value: "bitcoin", label: "Bitcoin" },
  { value: "binance", label: "Binance" },
  { value: "other", label: "Other" },
];

const CARD_PM_TYPES = new Set<PaymentMethodType>([
  "credit_card",
  "debit_card",
  "visa",
  "mastercard",
  "american_express",
  "amex",
  "rupay",
  "diners_club",
  "discover",
  "maestro",
]);

const PM_ICON_SLUGS: Partial<Record<PaymentMethodType, string>> = {
  credit_card: "creditcard",
  debit_card: "debitcard",
  visa: "visa",
  mastercard: "mastercard",
  american_express: "americanexpress",
  amex: "americanexpress",
  rupay: "rupay",
  diners_club: "dinersclub",
  discover: "discover",
  maestro: "maestro",
  upi: "upi",
  gpay: "googlepay",
  phonepe: "phonepe",
  paytm: "paytm",
  net_banking: "banktransfer",
  bank_transfer: "banktransfer",
  paypal: "paypal",
  apple_pay: "applepay",
  amazon_pay: "amazonpay",
  samsung_pay: "samsungpay",
  wallet: "wallet",
  crypto: "btc",
  bitcoin: "btc",
  binance: "binance",
};

function isCardPaymentType(type: PaymentMethodType) {
  return CARD_PM_TYPES.has(type);
}

export default function PaymentsPage() {
  const { data: pms, isLoading } = usePaymentMethods();
  const { data: subs } = useSubscriptions();
  const currency = useAppStore((s) => s.preferredCurrency);
  const [addOpen, setAddOpen] = useState(false);

  const activeSubs = useMemo(
    () => (subs ?? []).filter((s) => s.status === "active" || s.status === "trial"),
    [subs]
  );

  if (isLoading) return <PaymentsSkeleton />;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Payment Methods
          </h1>
          <p className="text-sm text-muted-foreground">
            {pms?.length ?? 0} method{(pms?.length ?? 0) !== 1 ? "s" : ""} saved
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" /> Add
        </Button>
      </div>

      {!pms || pms.length === 0 ? (
        <IllustratedEmptyState
          icon={Wallet}
          title="No payment methods yet"
          description="Add your cards and wallets to link them with subscriptions."
          tone="green"
        >
          <Button onClick={() => setAddOpen(true)} className="rounded-xl">
            <Plus className="mr-2 h-4 w-4" /> Add payment method
          </Button>
        </IllustratedEmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pms.map((pm, i) => {
            const linked = activeSubs.filter((s) => s.payment_method_id === pm.id);
            const drain = linked.reduce(
              (sum, s) =>
                sum +
                billingCycleToMonthly(
                  s.billing_cycle,
                  CurrencyUtil.convert(s.amount, s.currency, currency)
                ),
              0
            );
            const exp = expiryLabel(pm);

            return (
              <motion.div
                key={pm.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={`/payments/${pm.id}`}
                  className="glass-card flex flex-col gap-3 p-5 transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <PaymentMethodIcon type={pm.type} iconSlug={pm.icon_slug} size={44} />
                    {pm.is_default === 1 && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                        <Star className="h-3 w-3" /> Default
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{maskedLabel(pm)}</p>
                    <p className="text-xs text-muted-foreground">
                      {paymentMethodTypeLabel(pm.type)}
                      {exp && ` · Exp ${exp}`}
                    </p>
                  </div>
                  <div className="flex items-end justify-between border-t border-border/30 pt-3">
                    <span className="text-xs text-muted-foreground">
                      {linked.length} sub{linked.length !== 1 ? "s" : ""} linked
                    </span>
                    <span className="text-sm font-semibold">
                      {CurrencyUtil.formatAmount(drain, currency)}/mo
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      <AddPaymentMethodModal open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function AddPaymentMethodModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const create = useCreatePaymentMethod();
  const [form, setForm] = useState({
    name: "",
    type: "credit_card" as PaymentMethodType,
    last_four: "",
    expiry_month: "",
    expiry_year: "",
    is_default: false,
  });

  const update = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      const isCard = isCardPaymentType(form.type);
      await create.mutateAsync({
        name: form.name.trim(),
        type: form.type,
        icon_slug: PM_ICON_SLUGS[form.type],
        last_four: isCard ? form.last_four || undefined : undefined,
        expiry_month: isCard && form.expiry_month ? parseInt(form.expiry_month) : undefined,
        expiry_year: isCard && form.expiry_year ? parseInt(form.expiry_year) : undefined,
        is_default: form.is_default,
      });
      toast.success(`${form.name} added`);
      onOpenChange(false);
      setForm({
        name: "",
        type: "credit_card",
        last_four: "",
        expiry_month: "",
        expiry_year: "",
        is_default: false,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input
              placeholder="e.g. HDFC Visa, Google Pay..."
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <div className="flex flex-wrap gap-2">
              {PM_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => update("type", t.value)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
                    form.type === t.value
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:border-foreground/30"
                  }`}
                >
                  <PaymentMethodIcon type={t.value} size={24} shadow={false} className="rounded-md border" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {isCardPaymentType(form.type) && (
            <>
              <div className="space-y-1.5">
                <Label>Last 4 Digits</Label>
                <Input
                  placeholder="1234"
                  maxLength={4}
                  value={form.last_four}
                  onChange={(e) => update("last_four", e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Expiry Month</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    placeholder="MM"
                    value={form.expiry_month}
                    onChange={(e) => update("expiry_month", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Expiry Year</Label>
                  <Input
                    type="number"
                    min={2024}
                    max={2040}
                    placeholder="YYYY"
                    value={form.expiry_year}
                    onChange={(e) => update("expiry_year", e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex items-center gap-3">
            <Switch
              checked={form.is_default}
              onCheckedChange={(v) => update("is_default", v)}
            />
            <Label>Set as default</Label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Adding..." : "Add Method"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PaymentsSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
