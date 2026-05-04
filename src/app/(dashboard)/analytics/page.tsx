"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { format, subMonths } from "date-fns";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import {
  TrendingDown,
  TrendingUp,
  Zap,
  AlertTriangle,
  Gauge,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/shared/stat-tile";
import { useSubscriptions } from "@/lib/hooks/use-subscriptions";
import { usePaymentMethods } from "@/lib/hooks/use-payment-methods";
import { useCategories } from "@/lib/hooks/use-categories";
import { useForecast } from "@/lib/hooks/use-insights";
import { useAppStore } from "@/lib/stores/app-store";
import {
  CurrencyUtil,
  billingCycleToMonthly,
  billingCycleToYearly,
  billingCycleLabel,
} from "@/lib/utils/currency";
import { ServiceAvatar } from "@/components/shared/service-avatar";
import { IllustratedEmptyState } from "@/components/shared/empty-state";
import { PaymentMethodIcon } from "@/components/shared/payment-method-icon";
import type { BillingCycle } from "@/lib/models/types";

type Range = "3m" | "6m" | "12m";

// CSS-var backed colors so every chart adapts to light/dark theme.
const CHART_VARS = [
  "var(--neo-gold)",
  "var(--neo-lilac)",
  "var(--neo-mint)",
  "var(--neo-sky)",
  "var(--neo-coral)",
  "var(--neo-lemon)",
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export default function AnalyticsPage() {
  const { data: subs, isLoading } = useSubscriptions();
  const { data: pms } = usePaymentMethods();
  const { data: categories } = useCategories();
  const { data: forecast } = useForecast(12);
  const currency = useAppStore((s) => s.preferredCurrency);
  const [range, setRange] = useState<Range>("6m");

  const activeSubs = useMemo(
    () => (subs ?? []).filter((s) => s.status === "active" || s.status === "trial"),
    [subs]
  );

  const monthlyTotal = useMemo(
    () =>
      activeSubs.reduce(
        (sum, s) =>
          sum +
          billingCycleToMonthly(
            s.billing_cycle,
            CurrencyUtil.convert(s.amount, s.currency, currency)
          ),
        0
      ),
    [activeSubs, currency]
  );

  const yearlyTotal = useMemo(
    () =>
      activeSubs.reduce(
        (sum, s) =>
          sum +
          billingCycleToYearly(
            s.billing_cycle,
            CurrencyUtil.convert(s.amount, s.currency, currency)
          ),
        0
      ),
    [activeSubs, currency]
  );

  // Spending trend — uses the real `/insights/forecast` data instead of
  // synthetic sine-wave numbers. Falls back to a flat line at monthlyTotal
  // until forecast arrives so the chart still renders.
  const rangeMonths = range === "3m" ? 3 : range === "6m" ? 6 : 12;
  const spendingTrend = useMemo(() => {
    const fromForecast = (forecast?.months ?? []).slice(0, rangeMonths);
    if (fromForecast.length === rangeMonths) {
      return fromForecast.map((m) => {
        const [y, mm] = m.month.split("-").map(Number);
        const d = new Date(y, (mm ?? 1) - 1, 1);
        return { month: format(d, "MMM"), total: Math.round(m.total) };
      });
    }
    // Fallback: flat line at current monthly burn
    return Array.from({ length: rangeMonths }, (_, i) => {
      const m = subMonths(new Date(), rangeMonths - 1 - i);
      return { month: format(m, "MMM"), total: Math.round(monthlyTotal) };
    });
  }, [forecast, rangeMonths, monthlyTotal]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    if (!categories) return [];
    const map = new Map<string, { name: string; color: string; total: number }>();
    for (const sub of activeSubs) {
      const cat = categories.find((c) => c.id === sub.category_id);
      const key = cat?.id ?? "uncategorized";
      const existing = map.get(key) ?? {
        name: cat?.name ?? "Uncategorized",
        color: cat?.colour_hex ?? "#636366",
        total: 0,
      };
      existing.total += billingCycleToMonthly(
        sub.billing_cycle,
        CurrencyUtil.convert(sub.amount, sub.currency, currency)
      );
      map.set(key, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [activeSubs, categories, currency]);

  // Billing cycle distribution
  const cycleDistribution = useMemo(() => {
    const map = new Map<BillingCycle, number>();
    for (const sub of activeSubs) {
      map.set(sub.billing_cycle, (map.get(sub.billing_cycle) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([cycle, count]) => ({
      name: billingCycleLabel(cycle),
      value: count,
    }));
  }, [activeSubs]);

  // Top services
  const topServices = useMemo(() => {
    return [...activeSubs]
      .sort(
        (a, b) =>
          billingCycleToMonthly(
            b.billing_cycle,
            CurrencyUtil.convert(b.amount, b.currency, currency)
          ) -
          billingCycleToMonthly(
            a.billing_cycle,
            CurrencyUtil.convert(a.amount, a.currency, currency)
          )
      )
      .slice(0, 5);
  }, [activeSubs, currency]);

  // Payment method distribution
  const pmDistribution = useMemo(() => {
    if (!pms) return [];
    const map = new Map<string, { name: string; type: string; iconSlug: string | null; total: number }>();
    for (const sub of activeSubs) {
      const pm = pms.find((p) => p.id === sub.payment_method_id);
      const key = pm?.id ?? "none";
      const existing = map.get(key) ?? {
        name: pm?.name ?? "Unlinked",
        type: pm?.type ?? "other",
        iconSlug: pm?.icon_slug ?? null,
        total: 0,
      };
      existing.total += billingCycleToMonthly(
        sub.billing_cycle,
        CurrencyUtil.convert(sub.amount, sub.currency, currency)
      );
      map.set(key, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [activeSubs, pms, currency]);

  if (isLoading) return <AnalyticsSkeleton />;

  const isEmpty = activeSubs.length === 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "MMMM yyyy")}
          </p>
        </div>
      </div>

      {isEmpty ? (
        <IllustratedEmptyState
          icon={TrendingUp}
          title="No data yet"
          description="Add subscriptions to unlock spend trends, category splits, and renewal insights."
          tone="blue"
        />
      ) : (
        <>
          {/* Range selector */}
          <div className="flex gap-1.5">
            {(["3m", "6m", "12m"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-lg border-2 px-4 py-1.5 text-xs font-black uppercase tracking-wider transition-all ${
                  range === r
                    ? "border-foreground/80 bg-primary/15 text-foreground"
                    : "border-transparent text-muted-foreground hover:border-foreground/30"
                }`}
                style={range === r ? { boxShadow: "2px 2px 0px var(--foreground)" } : undefined}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile
              label="Monthly Total"
              value={CurrencyUtil.formatAmount(monthlyTotal, currency, { compact: true })}
              icon={<TrendingDown className="h-5 w-5" />}
              tone="coral"
              delay={0.04}
            />
            <StatTile
              label="Yearly Total"
              value={CurrencyUtil.formatAmount(yearlyTotal, currency, { compact: true })}
              icon={<TrendingUp className="h-5 w-5" />}
              tone="lemon"
              delay={0.08}
            />
            <StatTile
              label="Active Subs"
              value={String(activeSubs.length)}
              icon={<Zap className="h-5 w-5" />}
              tone="mint"
              delay={0.12}
            />
            <StatTile
              label="Avg / Sub"
              value={CurrencyUtil.formatAmount(
                activeSubs.length > 0 ? monthlyTotal / activeSubs.length : 0,
                currency
              )}
              icon={<Gauge className="h-5 w-5" />}
              tone="sky"
              delay={0.16}
            />
          </div>

          {/* Charts grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Spending trend */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="brutal-card p-5"
            >
              <h3 className="mb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Spending Trend
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={spendingTrend}>
                  <defs>
                    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--neo-gold)" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="var(--neo-gold)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--neo-ink-ghost)" />
                  <XAxis dataKey="month" tick={{ fill: "var(--foreground)", fontSize: 11 }} stroke="var(--neo-ink-low)" />
                  <YAxis tick={{ fill: "var(--foreground)", fontSize: 11 }} stroke="var(--neo-ink-low)" tickFormatter={(v) => CurrencyUtil.formatAmount(Number(v), currency, { compact: true })} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "2px solid var(--neo-ink)",
                      borderRadius: 12,
                      boxShadow: "var(--brutal-shadow-sm)",
                      color: "var(--foreground)",
                      fontSize: 12,
                    }}
                    formatter={(val) => [
                      CurrencyUtil.formatAmount(Number(val), currency),
                      "Spend",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="var(--neo-gold)"
                    fill="url(#goldGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Category breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="brutal-card p-5"
            >
              <h3 className="mb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Category Breakdown
              </h3>
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={72}
                      paddingAngle={2}
                    >
                      {categoryBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {categoryBreakdown.slice(0, 6).map((cat) => (
                    <div key={cat.name} className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="flex-1 truncate text-xs">{cat.name}</span>
                      <span className="text-xs font-medium">
                        {CurrencyUtil.formatAmount(cat.total, currency)}/mo
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Top expensive */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="brutal-card p-5"
            >
              <h3 className="mb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Top Expensive
              </h3>
              <div className="space-y-3">
                {topServices.map((sub, i) => {
                  const mo = billingCycleToMonthly(
                    sub.billing_cycle,
                    CurrencyUtil.convert(sub.amount, sub.currency, currency)
                  );
                  const pct = monthlyTotal > 0 ? (mo / monthlyTotal) * 100 : 0;
                  return (
                    <div key={sub.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ServiceAvatar
                          serviceSlug={sub.service_slug}
                          serviceName={sub.service_name}
                          size={24}
                        />
                        <span className="flex-1 truncate text-sm">{sub.service_name}</span>
                        <span className="text-xs font-semibold">
                          {CurrencyUtil.formatAmount(mo, currency)}/mo
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-md border border-foreground/20 bg-muted">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(pct, 100)}%` }}
                          transition={{ duration: 0.6, delay: i * 0.1 }}
                          className="h-full bg-primary"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Billing cycle distribution */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="brutal-card p-5"
            >
              <h3 className="mb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Billing Cycles
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={cycleDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--neo-ink-ghost)" />
                  <XAxis type="number" tick={{ fill: "var(--foreground)", fontSize: 11 }} stroke="var(--neo-ink-low)" />
                  <YAxis type="category" dataKey="name" tick={{ fill: "var(--foreground)", fontSize: 11 }} stroke="var(--neo-ink-low)" width={80} />
                  <Bar dataKey="value" fill="var(--neo-gold)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Payment method distribution */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="brutal-card p-5 md:col-span-2"
            >
              <h3 className="mb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Payment Method Distribution
              </h3>
              <div className="space-y-3">
                {pmDistribution.map((pm, i) => {
                  const pct = monthlyTotal > 0 ? (pm.total / monthlyTotal) * 100 : 0;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-2 text-sm">
                          <PaymentMethodIcon type={pm.type} iconSlug={pm.iconSlug} size={28} shadow={false} className="rounded-lg border" />
                          <span className="truncate">{pm.name}</span>
                        </span>
                        <span className="text-xs font-semibold">
                          {CurrencyUtil.formatAmount(pm.total, currency)}/mo ({Math.round(pct)}%)
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-md border border-foreground/20 bg-muted">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(pct, 100)}%` }}
                          transition={{ duration: 0.6, delay: i * 0.1 }}
                          className="h-full"
                          style={{ backgroundColor: CHART_VARS[i % CHART_VARS.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
