"use client";

import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePaymentMethods,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
} from "@/lib/hooks/use-payment-methods";
import { useSubscriptions } from "@/lib/hooks/use-subscriptions";
import { useAppStore } from "@/lib/stores/app-store";
import { CurrencyUtil, billingCycleToMonthly } from "@/lib/utils/currency";
import {
  paymentMethodTypeLabel,
  maskedLabel,
  expiryLabel,
} from "@/lib/utils/subscription-helpers";
import { ServiceAvatar } from "@/components/shared/service-avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { PaymentMethodIcon } from "@/components/shared/payment-method-icon";
import { toast } from "sonner";
import Link from "next/link";

export default function PaymentMethodDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: pms, isLoading } = usePaymentMethods();
  const { data: subs } = useSubscriptions();
  const currency = useAppStore((s) => s.preferredCurrency);
  const updatePm = useUpdatePaymentMethod();
  const deletePm = useDeletePaymentMethod();

  const pm = useMemo(() => pms?.find((p) => p.id === id), [pms, id]);
  const linked = useMemo(
    () =>
      (subs ?? []).filter(
        (s) =>
          s.payment_method_id === id &&
          (s.status === "active" || s.status === "trial")
      ),
    [subs, id]
  );

  const handleDelete = async () => {
    if (!pm) return;
    if (linked.length > 0) {
      toast.error("Unlink all subscriptions before deleting");
      return;
    }
    if (!confirm(`Delete ${pm.name}?`)) return;
    try {
      await deletePm.mutateAsync(pm.id);
      toast.success("Deleted");
      router.push("/payments");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleToggleDefault = async () => {
    if (!pm) return;
    try {
      await updatePm.mutateAsync({
        id: pm.id,
        is_default: pm.is_default === 1 ? 0 : 1,
      });
      toast.success(pm.is_default ? "Removed default" : "Set as default");
    } catch {
      toast.error("Failed to update");
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!pm) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <p>Payment method not found</p>
        <Link href="/payments">
          <Button variant="outline" className="rounded-xl">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </Link>
      </div>
    );
  }

  const totalDrain = linked.reduce(
    (sum, s) =>
      sum +
      billingCycleToMonthly(
        s.billing_cycle,
        CurrencyUtil.convert(s.amount, s.currency, currency)
      ),
    0
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <Link
        href="/payments"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-emphasised p-6"
      >
        <div className="flex items-start gap-4">
          <PaymentMethodIcon type={pm.type} iconSlug={pm.icon_slug} size={56} className="rounded-2xl" />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{maskedLabel(pm)}</h1>
              {pm.is_default === 1 && (
                <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                  <Star className="h-3 w-3" /> Default
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {paymentMethodTypeLabel(pm.type)}
              {expiryLabel(pm) && ` · Expires ${expiryLabel(pm)}`}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Monthly Drain</p>
            <p className="text-2xl font-bold tracking-tight">
              {CurrencyUtil.formatAmount(totalDrain, currency)}/mo
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Linked Subs</p>
            <p className="text-2xl font-bold">{linked.length}</p>
          </div>
        </div>
      </motion.div>

      {/* Linked subscriptions */}
      {linked.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card space-y-2 p-5"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Linked Subscriptions
          </h2>
          {linked.map((sub) => (
            <Link
              key={sub.id}
              href={`/subscriptions/${sub.id}`}
              className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-accent/50"
            >
              <ServiceAvatar
                serviceSlug={sub.service_slug}
                serviceName={sub.service_name}
                size={36}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{sub.service_name}</p>
              </div>
              <StatusBadge status={sub.status} />
              <p className="text-sm font-semibold">
                {CurrencyUtil.formatContextual(
                  CurrencyUtil.convert(sub.amount, sub.currency, currency),
                  currency,
                  sub.billing_cycle
                )}
              </p>
            </Link>
          ))}
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" className="rounded-xl" onClick={handleToggleDefault}>
          <Star className="mr-2 h-4 w-4" />
          {pm.is_default === 1 ? "Remove default" : "Make default"}
        </Button>
        <div className="flex-1" />
        <Button variant="destructive" className="rounded-xl" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </div>
    </div>
  );
}
