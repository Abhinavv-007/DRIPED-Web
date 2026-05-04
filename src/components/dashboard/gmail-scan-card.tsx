"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanSearch,
  Check,
  AlertCircle,
  Mail,
  Zap,
  Shield,
  UploadCloud,
  PencilLine,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useGmailScan, type DetectedSub } from "@/lib/hooks/use-gmail-scan";
import { useCreateSubscription, useSubscriptions } from "@/lib/hooks/use-subscriptions";
import { ServiceAvatar } from "@/components/shared/service-avatar";
import { CurrencyUtil, billingCycleLabel } from "@/lib/utils/currency";
import { getServiceInfo, normalizeServiceSlug } from "@/lib/constants/services";
import type { BillingCycle, SubscriptionCreateBody } from "@/lib/models/types";

type ImportCandidate = {
  id: string;
  selected: boolean;
  imported: boolean;
  serviceName: string;
  serviceSlug: string;
  amount: string;
  currency: string;
  billingCycle: BillingCycle;
  startDate: string;
  nextRenewalDate: string;
  emailSubject: string;
  emailDate: string | null;
};

const BILLING_CYCLES: BillingCycle[] = ["weekly", "monthly", "quarterly", "yearly", "lifetime"];

export function GmailScanCard() {
  const {
    status,
    progress,
    phase,
    emailsScanned,
    subscriptionsFound,
    foundServices,
    error,
    startScan,
    reset,
  } = useGmailScan();

  const progressPct = status === "scanning"
    ? phase === "auth" ? 5 : phase === "indexing" ? 15 : Math.min(90, 15 + (emailsScanned / Math.max(1, emailsScanned + 10)) * 75)
    : status === "done" ? 100 : 0;

  const scanKey = foundServices
    .map((svc) => `${svc.serviceSlug}:${svc.amount ?? "na"}:${svc.startDate ?? "no-start"}:${svc.nextRenewalDate ?? "no-renew"}:${svc.emailSubject}`)
    .join("|");

  return (
    <div className="brutal-card overflow-hidden p-0">
      {/* Header strip — uses the accent palette but all copy lives on the card */}
      <div
        className="flex items-center gap-3 border-b-2 p-5"
        style={{ borderColor: "var(--neo-ink)", background: "var(--neo-gold-soft)" }}
      >
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl border-2"
          style={{
            borderColor: "var(--neo-ink)",
            background: "var(--neo-gold)",
            color: "var(--primary-foreground)",
            boxShadow: "2px 2px 0px var(--neo-ink)",
          }}
        >
          <ScanSearch className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-black leading-tight text-foreground">
            Gmail Scanner
          </h3>
          <p className="text-xs font-bold text-foreground/75">
            Review detected subscriptions before importing them.
          </p>
        </div>
      </div>

      <div className="p-5">
      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="mb-4 space-y-2.5 rounded-xl border-2 border-foreground/30 bg-card p-3">
              {[
                { icon: Mail, text: "Scans your recent subscription emails", color: "text-info" },
                { icon: Zap, text: "Auto-detects popular services and default plans", color: "text-warning" },
                { icon: Shield, text: "Review, edit, and import only what you approve", color: "text-success" },
              ].map(({ icon: Icon, text, color }) => (
                <div key={text} className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
                  <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <button
              onClick={startScan}
              className="brutal-btn flex w-full items-center justify-center gap-2 bg-primary px-4 py-3 text-sm text-primary-foreground"
            >
              <ScanSearch className="h-4 w-4" /> Start Scanning
            </button>
          </motion.div>
        )}

        {status === "scanning" && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 space-y-3"
          >
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span>{progress}</span>
                <span>{Math.round(progressPct)}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-lg border-2 border-foreground/50 bg-muted">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="brutal-card-flat flex-1 p-3 text-center">
                <p className="text-2xl font-black">{emailsScanned}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Emails</p>
              </div>
              <div className="brutal-card-flat flex-1 p-3 text-center">
                <p className="text-2xl font-black text-primary">{subscriptionsFound}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Found</p>
              </div>
            </div>

            {foundServices.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {foundServices.map((svc, i) => (
                  <motion.div
                    key={svc.serviceSlug}
                    initial={{ opacity: 0, scale: 0.86 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", delay: Math.min(i, 6) * 0.03 }}
                  >
                    <ServiceAvatar serviceSlug={svc.serviceSlug} serviceName={svc.serviceName} size={28} />
                  </motion.div>
                ))}
              </div>
            )}

            <button onClick={reset} className="brutal-btn w-full bg-card px-4 py-2 text-xs">
              Cancel
            </button>
          </motion.div>
        )}

        {status === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 space-y-3"
          >
            <div className="brutal-card-flat flex items-center gap-3 bg-success/10 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-foreground/60 bg-success" style={{ boxShadow: "2px 2px 0px var(--foreground)" }}>
                <Check className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-black text-success">Scan Complete</p>
                <p className="text-xs font-medium text-muted-foreground">
                  {emailsScanned} emails scanned, {subscriptionsFound} detected.
                </p>
              </div>
            </div>

            {foundServices.length > 0 ? (
              <ScanImportReview
                key={scanKey}
                services={foundServices}
                onReset={reset}
              />
            ) : (
              <div className="brutal-card-flat space-y-3 bg-card p-4 text-center">
                <p className="text-sm font-black">No subscriptions detected</p>
                <p className="text-xs text-muted-foreground">
                  Try another scan later, or add a subscription manually.
                </p>
                <button onClick={reset} className="brutal-btn w-full bg-card px-4 py-2.5 text-sm">
                  Scan Again
                </button>
              </div>
            )}
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 space-y-3"
          >
            <div className="brutal-card-flat flex items-center gap-2 bg-danger/10 p-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-danger" />
              <p className="text-sm font-bold text-danger">{error}</p>
            </div>
            <button onClick={reset} className="brutal-btn w-full bg-card px-4 py-2.5 text-sm">
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

function ScanImportReview({
  services,
  onReset,
}: {
  services: DetectedSub[];
  onReset: () => void;
}) {
  const createSub = useCreateSubscription();
  const { data: existingSubs } = useSubscriptions();
  const [isImporting, setIsImporting] = useState(false);
  const [candidates, setCandidates] = useState<ImportCandidate[]>(() =>
    services.map((svc, index) => toCandidate(svc, index))
  );

  const existingSlugs = useMemo(() => {
    return new Set((existingSubs ?? []).map((sub) => normalizeServiceSlug(sub.service_slug)));
  }, [existingSubs]);

  const selectable = candidates.filter(
    (candidate) => !candidate.imported && !existingSlugs.has(normalizeServiceSlug(candidate.serviceSlug))
  );
  const selected = selectable.filter((candidate) => candidate.selected);
  const allSelected = selectable.length > 0 && selectable.every((candidate) => candidate.selected);
  const importedCount = candidates.filter((candidate) => candidate.imported).length;

  const updateCandidate = (id: string, patch: Partial<ImportCandidate>) => {
    setCandidates((current) =>
      current.map((candidate) => candidate.id === id ? { ...candidate, ...patch } : candidate)
    );
  };

  const toggleAll = () => {
    setCandidates((current) =>
      current.map((candidate) => {
        const disabled = candidate.imported || existingSlugs.has(normalizeServiceSlug(candidate.serviceSlug));
        return disabled ? candidate : { ...candidate, selected: !allSelected };
      })
    );
  };

  const importSelected = async () => {
    if (selected.length === 0) {
      toast.error("Select at least one subscription to import");
      return;
    }

    const invalid = selected.filter((candidate) => !isValidAmount(candidate.amount));
    if (invalid.length > 0) {
      toast.error("Add a valid amount before importing selected items");
      return;
    }

    setIsImporting(true);
    const results = await Promise.allSettled(
      selected.map((candidate) => createSub.mutateAsync(toCreateBody(candidate)))
    );

    const succeededIds = new Set<string>();
    const errors = new Map<string, number>();
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        succeededIds.add(selected[index].id);
      } else {
        const message = result.reason instanceof Error ? result.reason.message : "Import failed";
        errors.set(message, (errors.get(message) ?? 0) + 1);
      }
    });

    setCandidates((current) =>
      current.map((candidate) =>
        succeededIds.has(candidate.id)
          ? { ...candidate, imported: true, selected: false }
          : candidate
      )
    );
    setIsImporting(false);

    if (succeededIds.size > 0) {
      toast.success(`Imported ${succeededIds.size} subscription${succeededIds.size === 1 ? "" : "s"}`);
    }
    const failed = selected.length - succeededIds.size;
    if (failed > 0) {
      const [topError] = Array.from(errors.entries()).sort((a, b) => b[1] - a[1])[0] ?? ["Import failed"];
      toast.error(`${failed} item${failed === 1 ? "" : "s"} could not be imported: ${topError}`);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-black">
            <PencilLine className="h-4 w-4" /> Review before import
          </p>
          <p className="text-xs text-muted-foreground">
            Edit amount, billing cycle, start date, and renewal date before import.
          </p>
        </div>
        <button onClick={toggleAll} className="brutal-btn bg-card px-3 py-2 text-xs">
          {allSelected ? "Clear selection" : "Select all"}
        </button>
      </div>

      <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
        {candidates.map((candidate, index) => {
          const duplicate = existingSlugs.has(normalizeServiceSlug(candidate.serviceSlug));
          const disabled = candidate.imported || duplicate;

          return (
            <motion.div
              key={candidate.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index, 8) * 0.02 }}
              className={`brutal-card-flat bg-card p-3 ${disabled ? "opacity-70" : ""}`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={!disabled && candidate.selected}
                  disabled={disabled}
                  onChange={(event) => updateCandidate(candidate.id, { selected: event.target.checked })}
                  className="mt-3 size-4 accent-primary"
                  aria-label={`Import ${candidate.serviceName}`}
                />
                <ServiceAvatar
                  serviceSlug={candidate.serviceSlug}
                  serviceName={candidate.serviceName}
                  size={40}
                />
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="grid gap-2 md:grid-cols-[minmax(140px,1.4fr)_104px_112px_132px]">
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Service
                      </span>
                      <input
                        value={candidate.serviceName}
                        onChange={(event) => updateCandidate(candidate.id, { serviceName: event.target.value })}
                        className="brutal-input h-9 w-full bg-background py-1.5"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Amount
                      </span>
                      <input
                        value={candidate.amount}
                        inputMode="decimal"
                        onChange={(event) => updateCandidate(candidate.id, { amount: normaliseAmountInput(event) })}
                        className="brutal-input h-9 w-full bg-background py-1.5"
                        placeholder="0"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Currency
                      </span>
                      <select
                        value={candidate.currency}
                        onChange={(event) => updateCandidate(candidate.id, { currency: event.target.value })}
                        className="brutal-input h-9 w-full bg-background py-1.5"
                      >
                        {CurrencyUtil.supported.map((currency) => (
                          <option key={currency} value={currency}>
                            {CurrencyUtil.symbol(currency)} {currency}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Billing
                      </span>
                      <select
                        value={candidate.billingCycle}
                        onChange={(event) => {
                          const billingCycle = event.target.value as BillingCycle;
                          updateCandidate(candidate.id, {
                            billingCycle,
                            nextRenewalDate:
                              billingCycle === "lifetime"
                                ? ""
                                : candidate.nextRenewalDate || defaultNextRenewalDate(billingCycle, candidate.startDate),
                          });
                        }}
                        className="brutal-input h-9 w-full bg-background py-1.5"
                      >
                        {BILLING_CYCLES.map((cycle) => (
                          <option key={cycle} value={cycle}>
                            {billingCycleLabel(cycle)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-2 md:grid-cols-[132px_132px_1fr]">
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Start date
                      </span>
                      <input
                        type="date"
                        value={candidate.startDate}
                        onChange={(event) => updateCandidate(candidate.id, { startDate: event.target.value })}
                        className="brutal-input h-9 w-full bg-background py-1.5"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Next renewal
                      </span>
                      <input
                        type="date"
                        value={candidate.nextRenewalDate}
                        onChange={(event) => updateCandidate(candidate.id, { nextRenewalDate: event.target.value })}
                        className="brutal-input h-9 w-full bg-background py-1.5"
                      />
                    </label>
                    <div className="min-w-0 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Source email
                      </span>
                      <p className="truncate rounded-lg border-2 border-foreground/15 bg-muted px-3 py-2 text-xs text-muted-foreground">
                        {candidate.emailSubject || "Subscription email detected"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
                    {candidate.imported && (
                      <span className="inline-flex items-center gap-1 rounded-md border-2 border-success bg-success/10 px-2 py-1 text-success">
                        <CheckCircle2 className="h-3 w-3" /> Imported
                      </span>
                    )}
                    {duplicate && !candidate.imported && (
                      <span className="rounded-md border-2 border-foreground/30 bg-muted px-2 py-1 text-muted-foreground">
                        Already tracking
                      </span>
                    )}
                    {!isValidAmount(candidate.amount) && !candidate.imported && (
                      <span className="rounded-md border-2 border-warning bg-warning/20 px-2 py-1 text-[#7A5C00]">
                        Needs amount
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          onClick={importSelected}
          disabled={isImporting || selected.length === 0}
          className="brutal-btn flex flex-1 items-center justify-center gap-2 bg-primary px-4 py-3 text-sm text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <UploadCloud className="h-4 w-4" />
          {isImporting ? "Importing..." : `Import selected (${selected.length})`}
        </button>
        <button
          onClick={onReset}
          className="brutal-btn flex items-center justify-center gap-2 bg-card px-4 py-3 text-sm"
        >
          <RotateCcw className="h-4 w-4" /> Scan again
        </button>
      </div>

      {importedCount > 0 && (
        <Link
          href="/subscriptions"
          className="brutal-btn flex w-full items-center justify-center gap-2 bg-success px-4 py-3 text-sm font-black text-white"
        >
          <CheckCircle2 className="h-4 w-4" /> Open imported subscriptions
        </Link>
      )}
    </div>
  );
}

function toCandidate(svc: DetectedSub, index: number): ImportCandidate {
  const serviceSlug = normalizeServiceSlug(svc.serviceSlug || makeSlug(svc.serviceName));
  const info = getServiceInfo(serviceSlug);
  const billingCycle = svc.billingCycle || toBillingCycle(info?.defaultCycle);
  const amount = svc.amount ?? info?.defaultAmount ?? null;
  const startDate = svc.startDate || emailDateToInput(svc.emailDate) || todayInput();

  return {
    id: `${serviceSlug}-${index}`,
    selected: amount != null && amount > 0,
    imported: false,
    serviceName: info?.name ?? svc.serviceName,
    serviceSlug,
    amount: amount == null ? "" : String(amount),
    currency: svc.currency || info?.defaultCurrency || "INR",
    billingCycle,
    startDate,
    nextRenewalDate: svc.nextRenewalDate || defaultNextRenewalDate(billingCycle, startDate),
    emailSubject: svc.emailSubject,
    emailDate: svc.emailDate,
  };
}

function toCreateBody(candidate: ImportCandidate): SubscriptionCreateBody {
  return {
    service_name: candidate.serviceName.trim(),
    service_slug: normalizeServiceSlug(candidate.serviceSlug || makeSlug(candidate.serviceName)),
    amount: Number(candidate.amount),
    currency: candidate.currency,
    billing_cycle: candidate.billingCycle,
    start_date: candidate.startDate || emailDateToInput(candidate.emailDate) || todayInput(),
    next_renewal_date: candidate.nextRenewalDate || undefined,
    status: "active",
    source: "email_scan",
    is_trial: false,
    last_email_detected_at: emailDateToIso(candidate.emailDate),
    notes: candidate.emailSubject ? `Imported from Gmail scan: ${candidate.emailSubject}` : "Imported from Gmail scan",
  };
}

function isValidAmount(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
}

function normaliseAmountInput(event: ChangeEvent<HTMLInputElement>) {
  return event.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
}

function toBillingCycle(value: string | undefined): BillingCycle {
  return value && BILLING_CYCLES.includes(value as BillingCycle) ? value as BillingCycle : "monthly";
}

function makeSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function todayInput() {
  return dateInput(new Date());
}

function defaultNextRenewalDate(cycle: BillingCycle, baseDate?: string) {
  if (cycle === "lifetime") return "";
  const parsedBase = baseDate ? new Date(baseDate) : new Date();
  const date = Number.isNaN(parsedBase.getTime()) ? new Date() : parsedBase;
  switch (cycle) {
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "quarterly":
      date.setMonth(date.getMonth() + 3);
      break;
    case "yearly":
      date.setFullYear(date.getFullYear() + 1);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
  }
  return dateInput(date);
}

function dateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function emailDateToIso(value: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function emailDateToInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : dateInput(date);
}
