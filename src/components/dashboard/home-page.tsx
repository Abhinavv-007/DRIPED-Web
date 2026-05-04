"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  TrendingDown,
  TrendingUp,
  CalendarClock,
  WalletCards,
  Plus,
  ScanSearch,
  AlertTriangle,
  Zap,
  RefreshCw,
  Droplets,
  Flame,
  PiggyBank,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscriptions } from "@/lib/hooks/use-subscriptions";
import { usePaymentMethods } from "@/lib/hooks/use-payment-methods";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAppStore } from "@/lib/stores/app-store";
import { CurrencyUtil, billingCycleToMonthly, billingCycleToYearly } from "@/lib/utils/currency";
import {
  daysUntilRenewal,
  renewalDisplayLabel,
} from "@/lib/utils/subscription-helpers";
import { ServiceAvatar } from "@/components/shared/service-avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { GmailScanCard } from "@/components/dashboard/gmail-scan-card";
import { AnimatedLogo } from "@/components/shared/animated-logo";
import { IllustratedEmptyState } from "@/components/shared/empty-state";
import { PaymentMethodIcon } from "@/components/shared/payment-method-icon";
import { StatTile } from "@/components/shared/stat-tile";
import type { Subscription } from "@/lib/models/types";
import Link from "next/link";

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 6) return { greeting: "Up late", bg: "bg-[#D0E8FF]", textColor: "text-[#003D80]" };
  if (h < 12) return { greeting: "Good morning", bg: "bg-[#FFF3D0]", textColor: "text-[#7A5C00]" };
  if (h < 17) return { greeting: "Good afternoon", bg: "bg-[#D0E8FF]", textColor: "text-[#003D80]" };
  if (h < 21) return { greeting: "Good evening", bg: "bg-[#FFE0D0]", textColor: "text-[#7A2B00]" };
  return { greeting: "Good night", bg: "bg-[#D0E8FF]", textColor: "text-[#003D80]" };
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function HomePage() {
  // Home dashboard component — used by both root page and route group
  const user = useAuthStore((s) => s.user);
  const currency = useAppStore((s) => s.preferredCurrency);
  const { data: subs, isLoading: subsLoading, refetch } = useSubscriptions();
  const { data: pms, isLoading: pmsLoading } = usePaymentMethods();
  const reviewStreak = useReviewStreak();
  const timeOfDay = getTimeOfDay();

  const firstName = user?.full_name?.split(" ")[0] ?? "there";

  const activeSubs = useMemo(
    () => (subs ?? []).filter((s) => s.status === "active" || s.status === "trial"),
    [subs]
  );

  const monthlyTotal = useMemo(
    () =>
      activeSubs.reduce((sum, s) => {
        const converted = CurrencyUtil.convert(s.amount, s.currency, currency);
        return sum + billingCycleToMonthly(s.billing_cycle, converted);
      }, 0),
    [activeSubs, currency]
  );

  const yearlyTotal = useMemo(
    () =>
      activeSubs.reduce((sum, s) => {
        const converted = CurrencyUtil.convert(s.amount, s.currency, currency);
        return sum + billingCycleToYearly(s.billing_cycle, converted);
      }, 0),
    [activeSubs, currency]
  );

  const upcomingRenewals = useMemo(() => {
    return activeSubs
      .map((s) => ({ sub: s, days: daysUntilRenewal(s) }))
      .filter((r): r is { sub: Subscription; days: number } => r.days !== null && r.days >= 0 && r.days <= 30)
      .sort((a, b) => a.days - b.days)
      .slice(0, 5);
  }, [activeSubs]);

  const trialsSoon = useMemo(
    () => activeSubs.filter((s) => s.status === "trial" && s.trial_end_date),
    [activeSubs]
  );

  const avgPerSub = activeSubs.length > 0 ? monthlyTotal / activeSubs.length : 0;

  const isLoading = subsLoading || pmsLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const isEmpty = !subs || subs.length === 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      {/* Header */}
      <motion.div
        {...fadeUp}
        transition={{ delay: 0 }}
        className="flex items-center justify-between gap-3"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <AnimatedLogo size={48} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <motion.span
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                whileHover={{ rotate: -3, scale: 1.04 }}
                className={`flex size-7 shrink-0 items-center justify-center rounded-lg border-2 border-foreground/60 sm:size-8 ${timeOfDay.bg} ${timeOfDay.textColor}`}
                style={{ boxShadow: "2px 2px 0px var(--foreground)" }}
              >
                <Droplets className="size-3.5 sm:size-4" />
              </motion.span>
              {/* Wraps onto two lines on phones so long names don't get clipped.
                  Single line from sm: upward where there's room. */}
              <h1 className="min-w-0 flex-1 text-sm font-black leading-tight tracking-tight sm:text-xl md:text-2xl">
                <span className="block sm:inline">{timeOfDay.greeting},</span>{" "}
                <span className="block sm:truncate sm:inline">{firstName}</span>
              </h1>
            </div>
            <p className="text-xs font-bold text-muted-foreground">
              {format(new Date(), "EEEE, d MMMM yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 rounded-lg border-2 border-foreground/30 bg-card px-2 py-1.5 md:flex" title="Press ⌘K for command palette">
            <span className="kbd">⌘</span>
            <span className="kbd">K</span>
          </div>
          <button
            onClick={() => refetch()}
            className="brutal-btn bg-card p-2"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {isEmpty ? (
        <StarterPanel />
      ) : (
        <>
          {/* Stats Grid — Driped Neo pastel tiles */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <StatTile
              label="Monthly Spend"
              value={CurrencyUtil.formatAmount(monthlyTotal, currency, { compact: true })}
              icon={<TrendingDown className="h-5 w-5" />}
              tone="coral"
              delay={0.05}
            />
            <StatTile
              label="Yearly Projection"
              value={CurrencyUtil.formatAmount(yearlyTotal, currency, { compact: true })}
              icon={<TrendingUp className="h-5 w-5" />}
              tone="lemon"
              delay={0.1}
            />
            <StatTile
              label="Active Subs"
              value={String(activeSubs.length)}
              icon={<Zap className="h-5 w-5" />}
              tone="mint"
              delay={0.15}
            />
            <StatTile
              label="Avg / Sub"
              value={CurrencyUtil.formatAmount(avgPerSub, currency)}
              icon={<CalendarClock className="h-5 w-5" />}
              tone="sky"
              delay={0.2}
            />
          </div>

          <SavingsBanner
            activeCount={activeSubs.length}
            avgPerSub={avgPerSub}
            currency={currency}
            reviewStreak={reviewStreak}
            upcomingCount={upcomingRenewals.length}
          />

          {/* Trial warnings */}
          {trialsSoon.length > 0 && (
            <motion.div
              {...fadeUp}
              transition={{ delay: 0.12 }}
              className="brutal-stat brutal-stat--lemon flex items-center gap-3 p-4"
            >
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p className="text-sm">
                <span className="font-black">
                  {trialsSoon.length} trial{trialsSoon.length > 1 ? "s" : ""}
                </span>{" "}
                ending soon &mdash;{" "}
                {trialsSoon.map((s) => s.service_name).join(", ")}
              </p>
            </motion.div>
          )}

          {/* Gmail Scanner */}
          <motion.div {...fadeUp} transition={{ delay: 0.12 }}>
            <GmailScanCard />
          </motion.div>

          {/* Two-column layout */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Upcoming renewals */}
            <motion.div
              {...fadeUp}
              transition={{ delay: 0.16 }}
              className="brutal-card space-y-3 p-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Upcoming Renewals
                </h2>
                <Link
                  href="/subscriptions"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  View all
                </Link>
              </div>
              {upcomingRenewals.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No upcoming renewals in the next 30 days
                </p>
              ) : (
                <div className="space-y-2">
                  {upcomingRenewals.map(({ sub, days }) => (
                    <Link
                      key={sub.id}
                      href={`/subscriptions/detail?id=${sub.id}`}
                      className="brutal-card-flat flex items-center gap-3 p-2.5 transition-all hover:-translate-y-0.5"
                      style={{ transition: "transform 0.15s" }}
                    >
                      <ServiceAvatar
                        serviceSlug={sub.service_slug}
                        serviceName={sub.service_name}
                        size={38}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">
                          {sub.service_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {renewalDisplayLabel(sub)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black">
                          {CurrencyUtil.formatContextual(
                            CurrencyUtil.convert(sub.amount, sub.currency, currency),
                            currency,
                            sub.billing_cycle
                          )}
                        </p>
                        <p
                          className={`text-xs font-medium ${
                            days <= 3 ? "text-danger" : days <= 7 ? "text-warning" : "text-muted-foreground"
                          }`}
                        >
                          {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days}d`}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Wallet Overview */}
            <motion.div
              {...fadeUp}
              transition={{ delay: 0.20 }}
              className="brutal-card space-y-3 p-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Wallet Overview
                </h2>
                <Link
                  href="/payments"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Manage
                </Link>
              </div>
              {!pms || pms.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <WalletCards className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No payment methods added
                  </p>
                  <Link href="/payments">
                    <Button variant="outline" size="sm" className="rounded-xl">
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Add method
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {pms.slice(0, 4).map((pm) => {
                    const linked = activeSubs.filter(
                      (s) => s.payment_method_id === pm.id
                    );
                    const monthlyDrain = linked.reduce(
                      (sum, s) =>
                        sum +
                        billingCycleToMonthly(
                          s.billing_cycle,
                          CurrencyUtil.convert(s.amount, s.currency, currency)
                        ),
                      0
                    );
                    return (
                      <Link
                        key={pm.id}
                        href={`/payments/detail?id=${pm.id}`}
                        className="brutal-card-flat flex items-center gap-3 p-2.5 transition-all hover:-translate-y-0.5"
                        style={{ transition: "transform 0.15s" }}
                      >
                        <PaymentMethodIcon type={pm.type} iconSlug={pm.icon_slug} size={38} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">{pm.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {linked.length} sub{linked.length !== 1 ? "s" : ""} linked
                          </p>
                        </div>
                        <p className="text-sm font-black">
                          {CurrencyUtil.formatAmount(monthlyDrain, currency)}/mo
                        </p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* Recent Subscriptions */}
          <motion.div
            {...fadeUp}
            transition={{ delay: 0.24 }}
            className="brutal-card space-y-3 p-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                All Active Subscriptions
              </h2>
              <Link href="/subscriptions">
                <Button variant="ghost" size="sm" className="rounded-xl text-xs">
                  See all ({subs?.length ?? 0})
                </Button>
              </Link>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {activeSubs.slice(0, 6).map((sub) => (
                <Link
                  key={sub.id}
                  href={`/subscriptions/detail?id=${sub.id}`}
                  className="brutal-card-flat flex items-center gap-3 p-3 transition-all hover:-translate-y-0.5"
                  style={{ transition: "transform 0.15s" }}
                >
                  <ServiceAvatar
                    serviceSlug={sub.service_slug}
                    serviceName={sub.service_name}
                    size={36}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">
                      {sub.service_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {CurrencyUtil.formatContextual(
                        CurrencyUtil.convert(sub.amount, sub.currency, currency),
                        currency,
                        sub.billing_cycle
                      )}
                    </p>
                  </div>
                  <StatusBadge status={sub.status} />
                </Link>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

function StarterPanel() {
  return (
    <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
      <IllustratedEmptyState
        icon={Plus}
        title="Start tracking your subscriptions"
        description="Add your first subscription or scan Gmail to auto-detect recurring charges."
        tone="gold"
        className="brutal-card"
      >
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/subscriptions?add=true">
            <Button className="rounded-xl">
              <Plus className="mr-2 h-4 w-4" /> Add subscription
            </Button>
          </Link>
          <Link href="/profile#scan">
            <Button variant="outline" className="rounded-xl">
              <ScanSearch className="mr-2 h-4 w-4" /> Scan Gmail
            </Button>
          </Link>
        </div>
      </IllustratedEmptyState>
    </motion.div>
  );
}

function SavingsBanner({
  activeCount,
  avgPerSub,
  currency,
  reviewStreak,
  upcomingCount,
}: {
  activeCount: number;
  avgPerSub: number;
  currency: string;
  reviewStreak: number;
  upcomingCount: number;
}) {
  const yearlyFocus = avgPerSub * 12;

  return (
    <motion.div
      {...fadeUp}
      transition={{ delay: 0.12 }}
      className="brutal-stat brutal-stat--mint overflow-hidden p-4"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex size-12 items-center justify-center rounded-xl border-2"
            style={{
              borderColor: "var(--neo-ink)",
              background: "var(--neo-lemon)",
              boxShadow: "3px 3px 0px var(--neo-ink)",
              color: "var(--neo-ink)",
            }}
          >
            <Flame className="size-6" />
          </div>
          <div>
            <p className="font-heading text-[10px] font-black uppercase tracking-[0.16em] opacity-70">
              Renewal Review Streak
            </p>
            <h2 className="font-heading text-xl font-black tracking-tight">
              {reviewStreak} day{reviewStreak === 1 ? "" : "s"} of staying ahead
            </h2>
          </div>
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-2 md:w-[420px]">
          <div
            className="brutal-card-flat p-3"
            style={{ background: "color-mix(in srgb, var(--neo-surface) 85%, transparent)" }}
          >
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground font-heading">
              <PiggyBank className="size-4" /> Savings Focus
            </div>
            <p className="mt-1 font-black text-foreground tabular-nums">
              {CurrencyUtil.formatAmount(yearlyFocus, currency, { compact: true })}/yr
            </p>
            <p className="text-xs text-muted-foreground">Potential if one average sub is cut.</p>
          </div>
          <div
            className="brutal-card-flat p-3"
            style={{ background: "color-mix(in srgb, var(--neo-surface) 85%, transparent)" }}
          >
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground font-heading">
              <Target className="size-4" /> Watchlist
            </div>
            <p className="mt-1 font-black text-foreground tabular-nums">
              {upcomingCount} renewal{upcomingCount === 1 ? "" : "s"}
            </p>
            <p className="text-xs text-muted-foreground">
              {activeCount} active sub{activeCount === 1 ? "" : "s"} under review.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function useReviewStreak() {
  const [streak, setStreak] = useState(1);

  useEffect(() => {
    const today = localDateKey(new Date());
    const stored = window.localStorage.getItem("driped-review-streak");
    let nextStreak = 1;

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { lastVisit?: string; streak?: number };
        const diff = parsed.lastVisit ? daysBetween(parsed.lastVisit, today) : null;
        if (diff === 0) {
          nextStreak = Math.max(1, parsed.streak ?? 1);
        } else if (diff === 1) {
          nextStreak = Math.max(1, (parsed.streak ?? 1) + 1);
        }
      } catch {
        nextStreak = 1;
      }
    }

    window.localStorage.setItem(
      "driped-review-streak",
      JSON.stringify({ lastVisit: today, streak: nextStreak })
    );
    const timer = window.setTimeout(() => setStreak(nextStreak), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return streak;
}

function localDateKey(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function daysBetween(fromKey: string, toKey: string) {
  const from = new Date(`${fromKey}T12:00:00`);
  const to = new Date(`${toKey}T12:00:00`);
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
