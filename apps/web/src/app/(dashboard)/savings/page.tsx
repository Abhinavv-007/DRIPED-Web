"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  PiggyBank,
  Gauge,
  TrendingDown,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Copy as CopyIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/shared/stat-tile";
import { ServiceAvatar } from "@/components/shared/service-avatar";
import { IllustratedEmptyState } from "@/components/shared/empty-state";
import { useSavingsInsights, runWhatIf, type WhatIfResult } from "@/lib/hooks/use-insights";
import { useAppStore } from "@/lib/stores/app-store";
import { CurrencyUtil } from "@/lib/utils/currency";

export default function SavingsPage() {
  const currency = useAppStore((s) => s.preferredCurrency);
  const { data, isLoading } = useSavingsInsights();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [whatIf, setWhatIf] = useState<WhatIfResult | null>(null);
  const [simulating, setSimulating] = useState(false);

  const candidates = data?.cancel_candidates ?? [];
  const ghosts = data?.ghosts ?? [];
  const annualHints = data?.annual_hints ?? [];
  const totals = data?.totals;

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const runSim = async () => {
    if (selected.size === 0) return;
    setSimulating(true);
    try {
      const result = await runWhatIf(Array.from(selected));
      setWhatIf(result);
    } finally {
      setSimulating(false);
    }
  };

  const totalSelectedSaving = useMemo(() => {
    return candidates
      .filter((c) => selected.has(c.subscription_id))
      .reduce((sum, c) => sum + c.yearly_saving, 0);
  }, [candidates, selected]);

  if (isLoading) return <SavingsSkeleton />;
  if (!data) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <span
          className="flex size-10 items-center justify-center rounded-xl border-2"
          style={{
            background: "var(--neo-mint)",
            color: "var(--neo-ink-light)",
            borderColor: "var(--neo-ink)",
            boxShadow: "3px 3px 0 var(--neo-ink)",
          }}
        >
          <PiggyBank className="size-5 text-[color:var(--foreground)]" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-black tracking-tight md:text-3xl">
            Stop the Drip
          </h1>
          <p className="text-sm text-muted-foreground">
            Subscriptions we spotted you could cut or switch.
          </p>
        </div>
      </motion.div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatTile
          label="Active Subs"
          value={String(totals?.active_count ?? 0)}
          icon={<Gauge className="h-5 w-5" />}
          tone="sky"
          delay={0.05}
        />
        <StatTile
          label="Monthly Burn"
          value={CurrencyUtil.formatAmount(totals?.monthly ?? 0, currency, { compact: true })}
          icon={<TrendingDown className="h-5 w-5" />}
          tone="coral"
          delay={0.1}
        />
        <StatTile
          label="Yearly Projection"
          value={CurrencyUtil.formatAmount(totals?.yearly ?? 0, currency, { compact: true })}
          icon={<TrendingDown className="h-5 w-5" />}
          tone="lemon"
          delay={0.15}
        />
        <StatTile
          label="Potential / yr"
          value={CurrencyUtil.formatAmount(totals?.potential_yearly_savings ?? 0, currency, { compact: true })}
          icon={<Sparkles className="h-5 w-5" />}
          tone="mint"
          delay={0.2}
        />
      </div>

      {/* Cancel candidates \u2014 selectable */}
      <section className="brutal-card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Cancel Candidates
          </h2>
          {selected.size > 0 && (
            <div className="flex items-center gap-3 text-sm">
              <span className="font-semibold">
                {selected.size} selected \u2014 save{" "}
                <span className="tabular-nums">
                  {CurrencyUtil.formatAmount(totalSelectedSaving, currency, { compact: true })}/yr
                </span>
              </span>
              <Button onClick={runSim} disabled={simulating} className="rounded-xl">
                {simulating ? "Simulating\u2026" : "Simulate"}
              </Button>
            </div>
          )}
        </div>
        {candidates.length === 0 ? (
          <IllustratedEmptyState
            icon={Sparkles}
            title="No cuts suggested"
            description="You're running a tight ship \u2014 nothing obvious to cancel right now."
            tone="green"
            className="border-none shadow-none"
          />
        ) : (
          <div className="space-y-2">
            {candidates.map((c) => {
              const isSel = selected.has(c.subscription_id);
              return (
                <div
                  key={c.subscription_id}
                  className={`brutal-card-flat flex cursor-pointer items-center gap-3 p-3 transition-all ${isSel ? "-translate-x-0.5 -translate-y-0.5" : ""}`}
                  style={{ boxShadow: isSel ? "var(--brutal-shadow-gold)" : "var(--brutal-shadow-sm)" }}
                  onClick={() => toggle(c.subscription_id)}
                >
                  <input
                    type="checkbox"
                    checked={isSel}
                    readOnly
                    className="size-4 accent-[color:var(--neo-gold)]"
                  />
                  <ServiceAvatar
                    serviceSlug={c.service_slug ?? ""}
                    serviceName={c.service_name}
                    size={36}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{c.service_name}</p>
                    <p className="flex items-center gap-1.5 text-xs font-medium text-foreground/70">
                      {c.reason === "ghost" ? (
                        <>
                          <AlertTriangle className="size-3 text-[color:var(--warning)]" />
                          No email activity in 60+ days
                        </>
                      ) : (
                        <>
                          <CopyIcon className="size-3 text-[color:var(--info)]" />
                          Possible duplicate plan
                        </>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black tabular-nums">
                      {CurrencyUtil.formatAmount(c.yearly_saving, currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">/yr saving</p>
                  </div>
                  <Link
                    href={`/subscriptions/detail?id=${c.subscription_id}`}
                    className="p-1 text-muted-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ChevronRight className="size-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* What-if result */}
      {whatIf && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="brutal-stat brutal-stat--mint p-5"
        >
          <p className="font-heading text-[10px] font-black uppercase tracking-[0.16em] opacity-80">
            What-if
          </p>
          <h3 className="mt-1 text-xl font-black tracking-tight">
            Cancel {whatIf.cancelled_count} \u2192 keep{" "}
            <span className="tabular-nums">
              {CurrencyUtil.formatAmount(whatIf.saving.yearly, currency, { compact: true })}/yr
            </span>
          </h3>
          <p className="text-sm opacity-80">
            From {CurrencyUtil.formatAmount(whatIf.baseline.yearly, currency, { compact: true })}/yr
            \u2192 {CurrencyUtil.formatAmount(whatIf.projected.yearly, currency, { compact: true })}/yr
          </p>
        </motion.section>
      )}

      {/* Ghost subs */}
      <section className="brutal-card space-y-3 p-5">
        <h2 className="font-heading text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Ghost Subscriptions
        </h2>
        {ghosts.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">
            Every active subscription has recent email activity.
          </p>
        ) : (
          <div className="space-y-2">
            {ghosts.map((g) => (
              <Link
                key={g.subscription_id}
                href={`/subscriptions/detail?id=${g.subscription_id}`}
                className="brutal-card-flat flex items-center gap-3 p-3 transition-all hover:-translate-y-0.5"
              >
                <ServiceAvatar
                  serviceSlug={g.service_slug ?? ""}
                  serviceName={g.service_name}
                  size={36}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{g.service_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {g.last_email_detected_at
                      ? `Last email ${new Date(g.last_email_detected_at).toLocaleDateString()}`
                      : "No email ever received"}
                  </p>
                </div>
                <div className="text-right tabular-nums">
                  <p className="text-sm font-black">
                    {CurrencyUtil.formatAmount(g.amount, g.currency ?? currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">/{g.billing_cycle}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Annual hints */}
      {annualHints.length > 0 && (
        <section className="brutal-card space-y-3 p-5">
          <h2 className="font-heading text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Switch to Yearly
          </h2>
          <div className="grid gap-2 md:grid-cols-2">
            {annualHints.map((a) => (
              <div key={a.subscription_id} className="brutal-card-flat p-3">
                <p className="text-sm font-bold">{a.service_name}</p>
                <p className="text-xs text-muted-foreground">
                  Switching to yearly could save{" "}
                  <span className="tabular-nums font-semibold">
                    {CurrencyUtil.formatAmount(a.estimated_savings, a.currency ?? currency, { compact: true })}/yr
                  </span>
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SavingsSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}
