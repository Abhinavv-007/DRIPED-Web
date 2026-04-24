"use client";

import { use, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Trash2,
  Pause,
  Play,
  Archive,
  Calendar,
  CreditCard,
  Tag,
  Clock,
  FileText,
  PencilLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useSubscriptions,
  useUpdateSubscription,
  useDeleteSubscription,
} from "@/lib/hooks/use-subscriptions";
import { usePaymentMethods } from "@/lib/hooks/use-payment-methods";
import { useCategories } from "@/lib/hooks/use-categories";
import { useAppStore } from "@/lib/stores/app-store";
import { CurrencyUtil, billingCycleToMonthly, billingCycleToYearly, billingCycleLabel } from "@/lib/utils/currency";
import {
  daysUntilRenewal,
  renewalDisplayLabel,
  statusLabel,
} from "@/lib/utils/subscription-helpers";
import { ServiceAvatar } from "@/components/shared/service-avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { ReceiptLocker } from "@/components/subscriptions/receipt-locker";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";
import type { BillingCycle, Subscription, SubscriptionStatus } from "@/lib/models/types";

const BILLING_CYCLES: BillingCycle[] = ["weekly", "monthly", "quarterly", "yearly", "lifetime"];
const SUB_STATUSES: SubscriptionStatus[] = ["active", "trial", "paused", "cancelled", "archived"];

export default function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: subs, isLoading } = useSubscriptions();
  const { data: pms } = usePaymentMethods();
  const { data: categories } = useCategories();
  const currency = useAppStore((s) => s.preferredCurrency);
  const updateSub = useUpdateSubscription();
  const deleteSub = useDeleteSubscription();
  const [editOpen, setEditOpen] = useState(false);

  const sub = useMemo(() => subs?.find((s) => s.id === id), [subs, id]);
  const pm = useMemo(() => pms?.find((p) => p.id === sub?.payment_method_id), [pms, sub]);
  const category = useMemo(
    () => categories?.find((c) => c.id === sub?.category_id),
    [categories, sub]
  );

  const handleStatusChange = async (status: string) => {
    if (!sub) return;
    try {
      await updateSub.mutateAsync({ id: sub.id, status: status as never });
      toast.success(`Subscription ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!sub) return;
    if (!confirm(`Delete ${sub.service_name}? This cannot be undone.`)) return;
    try {
      await deleteSub.mutateAsync(sub.id);
      toast.success("Subscription deleted");
      router.push("/subscriptions");
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (isLoading) return <DetailSkeleton />;
  if (!sub) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-lg font-medium">Subscription not found</p>
        <Link href="/subscriptions">
          <Button variant="outline" className="rounded-xl">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to subscriptions
          </Button>
        </Link>
      </div>
    );
  }

  const convertedAmount = CurrencyUtil.convert(sub.amount, sub.currency, currency);
  const monthly = billingCycleToMonthly(sub.billing_cycle, convertedAmount);
  const yearly = billingCycleToYearly(sub.billing_cycle, convertedAmount);
  const days = daysUntilRenewal(sub);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      {/* Back */}
      <Link
        href="/subscriptions"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-emphasised p-6"
      >
        <div className="flex items-start gap-4">
          <ServiceAvatar
            serviceSlug={sub.service_slug}
            serviceName={sub.service_name}
            size={56}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{sub.service_name}</h1>
              <StatusBadge status={sub.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {renewalDisplayLabel(sub)}
              {days !== null && days >= 0 && days <= 7 && (
                <span className="ml-2 text-warning">
                  ({days === 0 ? "Renewing today!" : `${days}d left`})
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Amount</p>
            <p className="text-2xl font-bold tracking-tight">
              {CurrencyUtil.formatContextual(convertedAmount, currency, sub.billing_cycle)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Monthly</p>
            <p className="text-xl font-semibold">
              {CurrencyUtil.formatAmount(monthly, currency)}/mo
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Yearly</p>
            <p className="text-xl font-semibold">
              {CurrencyUtil.formatAmount(yearly, currency)}/yr
            </p>
          </div>
        </div>
      </motion.div>

      {/* Details */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card divide-y divide-border/30 p-5"
      >
        <DetailRow
          icon={<Calendar className="h-4 w-4" />}
          label="Billing Cycle"
          value={billingCycleLabel(sub.billing_cycle)}
        />
        {sub.start_date && (
          <DetailRow
            icon={<Clock className="h-4 w-4" />}
            label="Start Date"
            value={format(new Date(sub.start_date), "d MMM yyyy")}
          />
        )}
        {sub.next_renewal_date && (
          <DetailRow
            icon={<Calendar className="h-4 w-4" />}
            label="Next Renewal"
            value={format(new Date(sub.next_renewal_date), "d MMM yyyy")}
          />
        )}
        {sub.is_trial === 1 && sub.trial_end_date && (
          <DetailRow
            icon={<Clock className="h-4 w-4" />}
            label="Trial Ends"
            value={format(new Date(sub.trial_end_date), "d MMM yyyy")}
          />
        )}
        {category && (
          <DetailRow
            icon={<Tag className="h-4 w-4" />}
            label="Category"
            value={
              <span className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: category.colour_hex }}
                />
                {category.name}
              </span>
            }
          />
        )}
        {pm && (
          <DetailRow
            icon={<CreditCard className="h-4 w-4" />}
            label="Payment Method"
            value={pm.name}
          />
        )}
        <DetailRow
          icon={<FileText className="h-4 w-4" />}
          label="Source"
          value={sourceLabel(sub.source)}
        />
        {sub.notes && (
          <DetailRow
            icon={<FileText className="h-4 w-4" />}
            label="Notes"
            value={sub.notes}
          />
        )}
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap gap-2"
      >
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => setEditOpen(true)}
        >
          <PencilLine className="mr-2 h-4 w-4" /> Edit
        </Button>
        {sub.status === "active" && (
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => handleStatusChange("paused")}
          >
            <Pause className="mr-2 h-4 w-4" /> Pause
          </Button>
        )}
        {sub.status === "paused" && (
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => handleStatusChange("active")}
          >
            <Play className="mr-2 h-4 w-4" /> Resume
          </Button>
        )}
        {sub.status !== "cancelled" && sub.status !== "archived" && (
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => handleStatusChange("cancelled")}
          >
            Cancel
          </Button>
        )}
        {sub.status !== "archived" && (
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => handleStatusChange("archived")}
          >
            <Archive className="mr-2 h-4 w-4" /> Archive
          </Button>
        )}
        <div className="flex-1" />
        <Button
          variant="destructive"
          className="rounded-xl"
          onClick={handleDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <ReceiptLocker subscriptionId={sub.id} />
      </motion.div>

      {editOpen && (
        <EditSubscriptionModal
          key={`${sub.id}-${sub.updated_at}`}
          sub={sub}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </div>
  );
}

function EditSubscriptionModal({
  sub,
  open,
  onOpenChange,
}: {
  sub: Subscription;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateSub = useUpdateSubscription();
  const [form, setForm] = useState(() => formFromSubscription(sub));

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.service_name.trim() || !isValidAmount(form.amount)) {
      toast.error("Service name and amount are required");
      return;
    }

    try {
      await updateSub.mutateAsync({
        id: sub.id,
        service_name: form.service_name.trim(),
        amount: Number(form.amount),
        currency: form.currency,
        billing_cycle: form.billing_cycle as BillingCycle,
        next_renewal_date: form.next_renewal_date || null,
        status: form.status as SubscriptionStatus,
        notes: form.notes.trim() || null,
        is_trial: form.status === "trial" ? 1 : 0,
      });
      toast.success("Subscription updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update subscription");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-2 border-foreground/80 sm:max-w-xl" style={{ boxShadow: "6px 6px 0px var(--foreground)" }}>
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Edit Subscription</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Service Name</Label>
              <Input
                value={form.service_name}
                onChange={(event) => update("service_name", event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Amount</Label>
              <Input
                inputMode="decimal"
                value={form.amount}
                onChange={(event) => update("amount", event.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <select
                value={form.currency}
                onChange={(event) => update("currency", event.target.value)}
                className="brutal-input h-9 w-full bg-background"
              >
                {CurrencyUtil.supported.map((code) => (
                  <option key={code} value={code}>
                    {CurrencyUtil.symbol(code)} {code}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Billing Cycle</Label>
              <select
                value={form.billing_cycle}
                onChange={(event) => update("billing_cycle", event.target.value)}
                className="brutal-input h-9 w-full bg-background"
              >
                {BILLING_CYCLES.map((cycle) => (
                  <option key={cycle} value={cycle}>
                    {billingCycleLabel(cycle)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select
                value={form.status}
                onChange={(event) => update("status", event.target.value)}
                className="brutal-input h-9 w-full bg-background"
              >
                {SUB_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Next Renewal</Label>
              <Input
                type="date"
                value={form.next_renewal_date}
                onChange={(event) => update("next_renewal_date", event.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Notes</Label>
              <textarea
                value={form.notes}
                onChange={(event) => update("notes", event.target.value)}
                className="brutal-input min-h-24 w-full resize-none bg-background"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateSub.isPending}>
              {updateSub.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function formFromSubscription(sub: Subscription) {
  return {
    service_name: sub.service_name,
    amount: String(sub.amount),
    currency: sub.currency,
    billing_cycle: sub.billing_cycle,
    status: sub.status,
    next_renewal_date: sub.next_renewal_date ?? "",
    notes: sub.notes ?? "",
  };
}

function isValidAmount(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
}

function sourceLabel(source: string): string {
  const labels: Record<string, string> = {
    manual: "Manual",
    email_scan: "Gmail Scan",
    email_auto: "Email Auto",
    import: "Import",
  };
  return labels[source] ?? source;
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="ml-auto text-sm font-medium">{value}</span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-44 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
