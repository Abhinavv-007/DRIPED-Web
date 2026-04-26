"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarDays, TrendingUp, Sparkles } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/shared/stat-tile";
import { useForecast, useCalendar } from "@/lib/hooks/use-insights";
import { useAppStore } from "@/lib/stores/app-store";
import { CurrencyUtil } from "@/lib/utils/currency";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ForecastPage() {
  const currency = useAppStore((s) => s.preferredCurrency);
  const { data: forecast, isLoading: forecastLoading } = useForecast(12);
  const { data: calendar, isLoading: calendarLoading } = useCalendar(90);

  const chartData = useMemo(() => {
    return (forecast?.months ?? []).map((m) => {
      const [y, mo] = m.month.split("-").map(Number);
      return {
        label: `${MONTH_LABELS[mo - 1]} '${String(y).slice(2)}`,
        total: m.total,
        charges: m.charges.length,
      };
    });
  }, [forecast]);

  const annualProjection = useMemo(() => {
    return (forecast?.months ?? []).reduce((s, m) => s + m.total, 0);
  }, [forecast]);

  const peakMonth = useMemo(() => {
    if (!forecast?.months?.length) return null;
    return forecast.months.reduce((a, b) => (b.total > a.total ? b : a));
  }, [forecast]);

  const { heatmap, totals } = useMemo(() => {
    const byDay = new Map<string, { total: number; count: number }>();
    for (const c of calendar?.charges ?? []) {
      const cur = byDay.get(c.date) ?? { total: 0, count: 0 };
      cur.total += c.amount;
      cur.count += 1;
      byDay.set(c.date, cur);
    }
    const days: Array<{ date: string; total: number; count: number }> = [];
    const today = new Date();
    for (let i = 0; i < 90; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const bucket = byDay.get(iso) ?? { total: 0, count: 0 };
      days.push({ date: iso, ...bucket });
    }
    const max = Math.max(1, ...days.map((d) => d.total));
    const totalCount = (calendar?.charges ?? []).length;
    return { heatmap: { days, max }, totals: { count: totalCount } };
  }, [calendar]);

  if (forecastLoading || calendarLoading) return <ForecastSkeleton />;

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
            background: "var(--neo-sky)",
            borderColor: "var(--neo-ink)",
            boxShadow: "3px 3px 0 var(--neo-ink)",
          }}
        >
          <TrendingUp className="size-5" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-black tracking-tight md:text-3xl">
            Forecast
          </h1>
          <p className="text-sm text-muted-foreground">
            What the next year looks like at your current pace.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        <StatTile
          label="Annual Projection"
          value={CurrencyUtil.formatAmount(annualProjection, currency, { compact: true })}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="lemon"
          delay={0.05}
        />
        <StatTile
          label="Peak Month"
          value={peakMonth ? `${CurrencyUtil.formatAmount(peakMonth.total, currency, { compact: true })}` : "\u2014"}
          delta={peakMonth ? labelFor(peakMonth.month) : undefined}
          icon={<Sparkles className="h-5 w-5" />}
          tone="coral"
          delay={0.1}
        />
        <StatTile
          label="Upcoming charges (90d)"
          value={String(totals.count)}
          icon={<CalendarDays className="h-5 w-5" />}
          tone="sky"
          delay={0.15}
        />
      </div>

      {/* Year bar chart */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="brutal-card p-5"
      >
        <h2 className="font-heading text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Next 12 Months
        </h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 16, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--neo-ink-ghost)" />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--foreground)", fontSize: 11, fontWeight: 600 }}
                stroke="var(--neo-ink-low)"
              />
              <YAxis
                tick={{ fill: "var(--foreground)", fontSize: 11, fontWeight: 600 }}
                stroke="var(--neo-ink-low)"
                tickFormatter={(v) =>
                  CurrencyUtil.formatAmount(v as number, currency, { compact: true })
                }
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "2px solid var(--neo-ink)",
                  borderRadius: 12,
                  boxShadow: "var(--brutal-shadow-sm)",
                  color: "var(--foreground)",
                }}
                formatter={(value) => [
                  CurrencyUtil.formatAmount(Number(value ?? 0), currency, { compact: true }),
                  "Total",
                ]}
              />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={i % 2 === 0 ? "var(--neo-gold)" : "var(--neo-lilac)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      {/* Calendar heatmap */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="brutal-card p-5"
      >
        <h2 className="font-heading text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Renewal Calendar (90 days)
        </h2>
        <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(18px,1fr))] gap-1.5">
          {heatmap.days.map((d) => {
            const intensity = d.total / heatmap.max;
            const bg = d.total === 0
              ? "var(--muted)"
              : `color-mix(in srgb, var(--neo-gold) ${Math.round(20 + intensity * 80)}%, transparent)`;
            return (
              <div
                key={d.date}
                title={d.total > 0
                  ? `${d.date} \u2022 ${d.count} charge${d.count === 1 ? "" : "s"} \u2022 ${CurrencyUtil.formatAmount(d.total, currency, { compact: true })}`
                  : d.date}
                className="aspect-square rounded-md border-2"
                style={{
                  background: bg,
                  borderColor: "var(--neo-ink)",
                }}
              />
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Brighter = heavier charge day. Hover any tile for details.
        </p>
      </motion.section>
    </div>
  );
}

function labelFor(month: string): string {
  const [y, mo] = month.split("-").map(Number);
  return `${MONTH_LABELS[mo - 1]} ${y}`;
}

function ForecastSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <Skeleton className="h-10 w-48" />
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}
