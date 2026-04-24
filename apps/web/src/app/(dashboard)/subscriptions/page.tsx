"use client";

import { useState, useMemo, Suspense, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  SlidersHorizontal,
  ArrowUpDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscriptions } from "@/lib/hooks/use-subscriptions";
import { useAppStore } from "@/lib/stores/app-store";
import { CurrencyUtil } from "@/lib/utils/currency";
import { renewalDisplayLabel } from "@/lib/utils/subscription-helpers";
import { ServiceAvatar } from "@/components/shared/service-avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { AddSubscriptionModal } from "@/components/subscriptions/add-subscription-modal";
import { Confetti, createConfettiPieces, type ConfettiPiece } from "@/components/shared/confetti";
import { IllustratedEmptyState } from "@/components/shared/empty-state";
import type { Subscription, SubscriptionStatus } from "@/lib/models/types";

type SortKey = "name" | "amount" | "renewal" | "created";
type ViewMode = "grid" | "list";

const STATUS_TABS: { value: SubscriptionStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "trial", label: "Trial" },
  { value: "paused", label: "Paused" },
  { value: "cancelled", label: "Cancelled" },
  { value: "archived", label: "Archived" },
];

export default function SubscriptionsPage() {
  return (
    <Suspense>
      <SubscriptionsContent />
    </Suspense>
  );
}

function SubscriptionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: subs, isLoading } = useSubscriptions();
  const currency = useAppStore((s) => s.preferredCurrency);

  const [addOpen, setAddOpen] = useState(searchParams.get("add") === "true");
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("renewal");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  useEffect(() => {
    if (searchParams.get("add") === "true") {
      const timer = window.setTimeout(() => setAddOpen(true), 0);
      return () => window.clearTimeout(timer);
    }
  }, [searchParams]);

  const handleAddOpenChange = useCallback(
    (nextOpen: boolean) => {
      setAddOpen(nextOpen);
      if (!nextOpen && searchParams.get("add") === "true") {
        router.replace("/subscriptions", { scroll: false });
      }
    },
    [router, searchParams]
  );

  const handleAddSuccess = useCallback(() => {
    setConfettiPieces(createConfettiPieces(56));
  }, []);

  const clearConfetti = useCallback(() => {
    setConfettiPieces([]);
  }, []);

  const filtered = useMemo(() => {
    let result = subs ?? [];

    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.service_name.toLowerCase().includes(q) ||
          s.service_slug.toLowerCase().includes(q)
      );
    }

    result = [...result].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.service_name.localeCompare(b.service_name);
        case "amount":
          return b.amount - a.amount;
        case "renewal":
          return (a.next_renewal_date ?? "z").localeCompare(b.next_renewal_date ?? "z");
        case "created":
          return b.created_at.localeCompare(a.created_at);
        default:
          return 0;
      }
    });

    return result;
  }, [subs, statusFilter, search, sortKey]);

  if (isLoading) return <SubscriptionsSkeleton />;

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">
            Subscriptions
          </h1>
          <p className="text-sm font-bold text-muted-foreground">
            {subs?.length ?? 0} total &middot;{" "}
            {subs?.filter((s) => s.status === "active").length ?? 0} active
          </p>
        </div>
        <motion.button
          whileHover={{ y: -2, boxShadow: "5px 5px 0px var(--foreground)" }}
          whileTap={{ y: 1, boxShadow: "2px 2px 0px var(--foreground)" }}
          onClick={() => setAddOpen(true)}
          className="brutal-btn flex items-center gap-2 bg-primary px-4 py-2.5 text-sm text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Add New
        </motion.button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Status tabs */}
        <div className="flex gap-1.5 overflow-x-auto">
          {STATUS_TABS.map((tab) => {
            const active = statusFilter === tab.value;
            const count =
              tab.value === "all"
                ? subs?.length ?? 0
                : subs?.filter((s) => s.status === tab.value).length ?? 0;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`whitespace-nowrap rounded-lg border-2 px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all ${
                  active
                    ? "border-foreground/80 bg-primary/15 text-foreground"
                    : "border-transparent text-muted-foreground hover:border-foreground/30"
                }`}
                style={active ? { boxShadow: "2px 2px 0px var(--foreground)" } : undefined}
              >
                {tab.label} {count}
              </button>
            );
          })}
        </div>

        {/* Search + controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64 md:flex-initial">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search subscriptions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="brutal-input w-full pl-9 text-sm"
            />
          </div>
          <button
            onClick={() =>
              setSortKey((prev) => {
                const keys: SortKey[] = ["renewal", "name", "amount", "created"];
                return keys[(keys.indexOf(prev) + 1) % keys.length];
              })
            }
            className="brutal-btn bg-card p-2.5"
            title={`Sort by ${sortKey}`}
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="brutal-btn bg-card p-2.5"
          >
            {viewMode === "grid" ? (
              <List className="h-4 w-4" />
            ) : (
              <LayoutGrid className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <IllustratedEmptyState
          icon={SlidersHorizontal}
          title="No subscriptions found"
          description={search ? "Try a different search term or clear your filters." : "Add your first subscription to start tracking recurring spend."}
          tone="blue"
        >
          <button
            onClick={() => setAddOpen(true)}
            className="brutal-btn flex items-center justify-center gap-2 bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground"
          >
            <Plus className="size-4" /> Add subscription
          </button>
        </IllustratedEmptyState>
      ) : viewMode === "grid" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((sub, i) => (
            <SubscriptionCard key={sub.id} sub={sub} currency={currency} index={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((sub, i) => (
            <SubscriptionRow key={sub.id} sub={sub} currency={currency} index={i} />
          ))}
        </div>
      )}

      <AddSubscriptionModal
        open={addOpen}
        onOpenChange={handleAddOpenChange}
        onSuccess={handleAddSuccess}
      />
      <Confetti pieces={confettiPieces} onDone={clearConfetti} />
    </div>
  );
}

function SubscriptionCard({
  sub,
  currency,
  index,
}: {
  sub: Subscription;
  currency: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Link
        href={`/subscriptions/${sub.id}`}
        className="brutal-card flex flex-col gap-3 p-4 transition-all hover:-translate-y-1"
        style={{ transition: "transform 0.15s, box-shadow 0.15s" }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "6px 6px 0px var(--foreground)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--brutal-shadow)"; }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <ServiceAvatar
              serviceSlug={sub.service_slug}
              serviceName={sub.service_name}
              size={40}
            />
            <div>
              <p className="font-medium">{sub.service_name}</p>
              <p className="text-xs text-muted-foreground">
                {renewalDisplayLabel(sub)}
              </p>
            </div>
          </div>
          <StatusBadge status={sub.status} />
        </div>
        <div className="flex items-end justify-between border-t-2 border-foreground/10 pt-3">
          <p className="text-xl font-black tracking-tight">
            {CurrencyUtil.formatContextual(
              CurrencyUtil.convert(sub.amount, sub.currency, currency),
              currency,
              sub.billing_cycle
            )}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

function SubscriptionRow({
  sub,
  currency,
  index,
}: {
  sub: Subscription;
  currency: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
    >
      <Link
        href={`/subscriptions/${sub.id}`}
        className="brutal-card-flat flex items-center gap-4 p-3 transition-all hover:-translate-y-0.5"
        style={{ transition: "transform 0.15s" }}
      >
        <ServiceAvatar
          serviceSlug={sub.service_slug}
          serviceName={sub.service_name}
          size={38}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{sub.service_name}</p>
          <p className="text-xs text-muted-foreground">
            {renewalDisplayLabel(sub)}
          </p>
        </div>
        <StatusBadge status={sub.status} />
        <p className="text-sm font-black">
          {CurrencyUtil.formatContextual(
            CurrencyUtil.convert(sub.amount, sub.currency, currency),
            currency,
            sub.billing_cycle
          )}
        </p>
      </Link>
    </motion.div>
  );
}

function SubscriptionsSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
