"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useCategories } from "@/lib/hooks/use-categories";
import { useSubscriptions } from "@/lib/hooks/use-subscriptions";
import { useAppStore } from "@/lib/stores/app-store";
import { CurrencyUtil, billingCycleToMonthly } from "@/lib/utils/currency";
import { staggerDelay } from "@/lib/utils/motion";
import { CategoryIcon } from "@/components/shared/category-icon";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoriesPage() {
  const { data: categories, isLoading: catsLoading } = useCategories();
  const { data: subs, isLoading: subsLoading } = useSubscriptions();
  const currency = useAppStore((s) => s.preferredCurrency);

  const activeSubs = useMemo(
    () => (subs ?? []).filter((s) => s.status === "active" || s.status === "trial"),
    [subs]
  );

  const catStats = useMemo(() => {
    if (!categories) return [];
    return categories.map((cat) => {
      const catSubs = activeSubs.filter((s) => s.category_id === cat.id);
      const monthlySpend = catSubs.reduce(
        (sum, s) =>
          sum +
          billingCycleToMonthly(
            s.billing_cycle,
            CurrencyUtil.convert(s.amount, s.currency, currency)
          ),
        0
      );
      return {
        category: cat,
        subCount: catSubs.length,
        monthlySpend,
        budgetPct:
          cat.budget_limit && cat.budget_limit > 0
            ? Math.min((monthlySpend / cat.budget_limit) * 100, 100)
            : null,
      };
    });
  }, [categories, activeSubs, currency]);

  const isLoading = catsLoading || subsLoading;
  if (isLoading) return <CategoriesSkeleton />;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Categories</h1>
      <p className="text-sm text-muted-foreground">
        {categories?.length ?? 0} categories &middot; Manage budgets and track spend per category
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {catStats.map((cs, i) => (
          <motion.div
            key={cs.category.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: staggerDelay(i) }}
          >
            <Link
              href={`/categories/${cs.category.id}`}
              className="glass-card flex flex-col gap-3 p-4 transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${cs.category.colour_hex}20` }}
                >
                  <CategoryIcon
                    iconName={cs.category.icon_name}
                    className="h-5 w-5"
                    size={20}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{cs.category.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {cs.subCount} sub{cs.subCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-lg font-bold tracking-tight">
                  {CurrencyUtil.formatAmount(cs.monthlySpend, currency)}/mo
                </p>
                {cs.budgetPct !== null && cs.category.budget_limit && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Budget</span>
                      <span
                        className={
                          cs.budgetPct >= 90
                            ? "font-medium text-danger"
                            : cs.budgetPct >= 70
                            ? "font-medium text-warning"
                            : "text-muted-foreground"
                        }
                      >
                        {Math.round(cs.budgetPct)}%
                      </span>
                    </div>
                    <Progress value={cs.budgetPct} className="h-1.5" />
                  </div>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function CategoriesSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
