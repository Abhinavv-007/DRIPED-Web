"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Globe,
  Sun,
  Moon,
  Bell,
  LogOut,
  Download,
  HelpCircle,
  Shield,
  ChevronRight,
  ScanSearch,
  Plus,
  WalletCards,
  CalendarClock,
  ClipboardList,
  Database,
  Target,
  TrendingDown,
  Copy,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAppStore } from "@/lib/stores/app-store";
import { useSubscriptions } from "@/lib/hooks/use-subscriptions";
import { usePaymentMethods } from "@/lib/hooks/use-payment-methods";
import { signOut } from "@/lib/firebase";
import { CurrencyUtil, billingCycleToMonthly } from "@/lib/utils/currency";
import { daysUntilRenewal, isGhost } from "@/lib/utils/subscription-helpers";
import { toast } from "sonner";
import { GmailScanCard } from "@/components/dashboard/gmail-scan-card";
import { NotificationSettings } from "@/components/shared/notification-settings";
import { StatTile } from "@/components/shared/stat-tile";
import { APP_VERSION_LABEL } from "@/lib/constants/app-version";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const currency = useAppStore((s) => s.preferredCurrency);
  const setCurrency = useAppStore((s) => s.setPreferredCurrency);
  const { data: subs, refetch } = useSubscriptions();
  const { data: pms } = usePaymentMethods();

  const activeSubs = useMemo(
    () => (subs ?? []).filter((s) => s.status === "active" || s.status === "trial"),
    [subs]
  );

  const monthlySpend = useMemo(
    () =>
      activeSubs.reduce((sum, sub) => {
        const converted = CurrencyUtil.convert(sub.amount, sub.currency, currency);
        return sum + billingCycleToMonthly(sub.billing_cycle, converted);
      }, 0),
    [activeSubs, currency]
  );

  const upcomingCount = useMemo(
    () =>
      activeSubs.filter((sub) => {
        const days = daysUntilRenewal(sub);
        return days !== null && days >= 0 && days <= 14;
      }).length,
    [activeSubs]
  );

  const importedCount = useMemo(
    () => (subs ?? []).filter((sub) => sub.source === "email_scan" || sub.source === "email_auto").length,
    [subs]
  );

  const needsReview = useMemo(
    () => activeSubs.filter((sub) => !sub.payment_method_id || isGhost(sub)).length,
    [activeSubs]
  );

  const handleSignOut = async () => {
    if (!confirm("Sign out of Driped?")) return;
    await signOut();
    useAuthStore.getState().reset();
    toast.success("Signed out");
  };

  const handleExport = () => {
    if (!subs || subs.length === 0) {
      toast.error("No subscriptions to export");
      return;
    }
    const csv = [
      "Name,Slug,Amount,Currency,Cycle,Status,Next Renewal",
      ...subs.map(
        (s) =>
          `"${s.service_name}","${s.service_slug}",${s.amount},${s.currency},${s.billing_cycle},${s.status},"${s.next_renewal_date ?? ""}"`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `driped-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported CSV");
  };

  const handleCopySnapshot = async () => {
    const snapshot = [
      `Driped snapshot for ${user?.email ?? "account"}`,
      `Active subscriptions: ${activeSubs.length}`,
      `Monthly spend: ${CurrencyUtil.formatAmount(monthlySpend, currency)}`,
      `Renewals in 14 days: ${upcomingCount}`,
      `Imported from Gmail: ${importedCount}`,
      `Needs review: ${needsReview}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(snapshot);
      toast.success("Snapshot copied");
    } catch {
      toast.error("Could not copy snapshot");
    }
  };

  const handleRefresh = async () => {
    await refetch();
    toast.success("Profile refreshed");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">Profile</h1>
          <p className="text-sm font-bold text-muted-foreground">Account, scanning, exports, and reminders</p>
        </div>
        <button onClick={handleRefresh} className="brutal-btn flex items-center gap-2 bg-card px-3 py-2 text-xs">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      <motion.div
        {...fadeUp}
        className="brutal-card flex flex-col gap-5 p-6 md:flex-row md:items-center"
      >
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2"
          style={{ borderColor: "var(--neo-ink)", boxShadow: "3px 3px 0px var(--neo-ink)" }}
        >
          <Avatar className="h-full w-full rounded-full">
            <AvatarImage src={user?.avatar_url ?? undefined} />
            <AvatarFallback className="rounded-full bg-primary text-xl font-black text-primary-foreground">
              {(user?.full_name ?? user?.email)?.[0]?.toUpperCase() ?? "D"}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-black tracking-tight text-foreground">
            {user?.full_name ?? "User"}
          </h2>
          <p className="truncate text-sm font-bold text-foreground/75">{user?.email}</p>
          {user?.created_at && (
            <p className="mt-1 text-xs font-semibold text-foreground/60">
              Member since {format(new Date(user.created_at), "MMMM yyyy")}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm md:w-72">
          <MiniStat label="Wallets" value={String(pms?.length ?? 0)} />
          <MiniStat label="Imported" value={String(importedCount)} />
        </div>
      </motion.div>

      <div className="grid gap-3 md:grid-cols-4">
        <StatTile
          label="Monthly Spend"
          value={CurrencyUtil.formatAmount(monthlySpend, currency, { compact: true })}
          icon={<TrendingDown className="h-5 w-5" />}
          tone="coral"
          delay={0.04}
        />
        <StatTile
          label="Active Subs"
          value={String(activeSubs.length)}
          icon={<ClipboardList className="h-5 w-5" />}
          tone="mint"
          delay={0.08}
        />
        <StatTile
          label="14-Day Renewals"
          value={String(upcomingCount)}
          icon={<CalendarClock className="h-5 w-5" />}
          tone="lemon"
          delay={0.12}
        />
        <StatTile
          label="Needs Review"
          value={String(needsReview)}
          icon={<Target className="h-5 w-5" />}
          tone="sky"
          delay={0.16}
        />
      </div>

      <motion.div
        {...fadeUp}
        transition={{ delay: 0.12 }}
        className="grid gap-3 md:grid-cols-4"
      >
        <QuickAction href="/subscriptions?add=true" icon={<Plus className="h-4 w-4" />} label="Add Sub" />
        <QuickAction href="/profile#scan" icon={<ScanSearch className="h-4 w-4" />} label="Scan Gmail" />
        <QuickAction href="/payments" icon={<WalletCards className="h-4 w-4" />} label="Wallets" />
        <QuickAction href="/subscriptions" icon={<CalendarClock className="h-4 w-4" />} label="Renewals" />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr]">
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.16 }}
          className="brutal-card divide-y-2 divide-foreground/10 p-1"
        >
          <SettingRow
            icon={theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            label="Dark Mode"
            action={
              <Switch
                checked={theme === "dark"}
                onCheckedChange={() => toggleTheme()}
              />
            }
          />

          <SettingRow
            icon={<Globe className="h-4 w-4" />}
            label="Currency"
            action={
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {CurrencyUtil.supported.map((c) => (
                  <option key={c} value={c}>
                    {CurrencyUtil.symbol(c)} {c}
                  </option>
                ))}
              </select>
            }
          />

          <SettingRow
            icon={<Bell className="h-4 w-4" />}
            label="Renewal Reminders"
            action={<Switch defaultChecked />}
          />
          <SettingRow
            icon={<Bell className="h-4 w-4" />}
            label="Trial Expiry Alerts"
            action={<Switch defaultChecked />}
          />

          <SettingRow
            icon={<Download className="h-4 w-4" />}
            label="Export Subscriptions"
            action={
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg"
                onClick={handleExport}
              >
                CSV <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            }
          />
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ delay: 0.18 }}
          className="brutal-card space-y-3 p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black">Data Toolkit</h2>
              <p className="text-xs text-muted-foreground">Snapshots, export, and scan controls</p>
            </div>
            <Database className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <button onClick={handleCopySnapshot} className="flex items-center gap-3 rounded-lg border-2 border-foreground/30 bg-card p-3 text-left transition-transform hover:-translate-y-0.5">
              <Copy className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">Copy Snapshot</span>
            </button>
            <button onClick={handleExport} className="flex items-center gap-3 rounded-lg border-2 border-foreground/30 bg-card p-3 text-left transition-transform hover:-translate-y-0.5">
              <Download className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">Export CSV</span>
            </button>
            <Link href="/subscriptions" className="flex items-center gap-3 rounded-lg border-2 border-foreground/30 bg-card p-3 text-left transition-transform hover:-translate-y-0.5">
              <ClipboardList className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">Subscription Table</span>
            </Link>
            <Link href="/profile#scan" className="flex items-center gap-3 rounded-lg border-2 border-foreground/30 bg-card p-3 text-left transition-transform hover:-translate-y-0.5">
              <ScanSearch className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">Import Queue</span>
            </Link>
          </div>
        </motion.div>
      </div>

      <motion.div {...fadeUp} transition={{ delay: 0.19 }}>
        <NotificationSettings />
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ delay: 0.2 }}
        id="scan"
      >
        <GmailScanCard />
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ delay: 0.24 }}
        className="brutal-card divide-y-2 divide-foreground/10 p-1"
      >
        <SettingRow
          icon={<Shield className="h-4 w-4" />}
          label="Privacy Policy"
          action={<ChevronRight className="h-4 w-4 text-muted-foreground" />}
        />
        <SettingRow
          icon={<HelpCircle className="h-4 w-4" />}
          label="Help & Support"
          action={<ChevronRight className="h-4 w-4 text-muted-foreground" />}
        />
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ delay: 0.28 }}
      >
        {/*
          Sign-out is destructive but routine — we want it to feel intentional,
          not alarming. We swap the candy-coral fill for a muted card surface
          with a coral icon + cream-tinted border so the action reads as
          "caution" instead of "emergency". The thick white outline is gone.
        */}
        <button
          className="brutal-btn flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-black"
          style={{
            background: "var(--card)",
            color: "var(--neo-coral)",
            borderColor: "color-mix(in srgb, var(--neo-coral) 60%, var(--neo-ink))",
          }}
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </motion.div>

      <p className="text-center text-xs font-bold text-muted-foreground/60">
        {APP_VERSION_LABEL}
      </p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border-2 border-foreground/25 bg-card px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-lg font-black">{value}</p>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -2, rotate: -0.5 }}
        whileTap={{ scale: 0.98 }}
        className="brutal-btn flex items-center justify-center gap-2 bg-card px-4 py-3 text-sm font-black"
      >
        {icon}
        {label}
      </motion.div>
    </Link>
  );
}

function SettingRow({
  icon,
  label,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1 text-sm font-bold">{label}</span>
      {action}
    </div>
  );
}
