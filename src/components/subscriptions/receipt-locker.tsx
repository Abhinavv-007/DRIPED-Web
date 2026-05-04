"use client";

import { format } from "date-fns";
import { Receipt, Mail } from "lucide-react";
import { useReceipts } from "@/lib/hooks/use-receipts";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyUtil } from "@/lib/utils/currency";

/**
 * Renders the per-subscription receipt-locker card: a chronological list of
 * email receipts that Gmail scanner has attached to this subscription.
 */
export function ReceiptLocker({ subscriptionId }: { subscriptionId: string }) {
  const { data, isLoading } = useReceipts(subscriptionId);

  if (isLoading) {
    return (
      <section className="brutal-card p-5">
        <Skeleton className="h-6 w-40" />
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  const receipts = data ?? [];

  return (
    <section className="brutal-card space-y-3 p-5">
      <div className="flex items-center gap-2">
        <Receipt className="size-4 text-muted-foreground" />
        <h2 className="font-heading text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Receipt Locker
        </h2>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {receipts.length} stored
        </span>
      </div>

      {receipts.length === 0 ? (
        <div className="py-4 text-center">
          <Mail className="mx-auto size-6 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">
            No receipts yet. Run a Gmail scan to populate this locker.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {receipts.map((r) => (
            <div key={r.id} className="brutal-card-flat flex items-start gap-3 p-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-[color:var(--neo-gold)]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  {r.subject || "(no subject)"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.sender ?? "—"}
                </p>
                {r.snippet && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/80">
                    {r.snippet}
                  </p>
                )}
              </div>
              <div className="text-right">
                {r.amount != null && (
                  <p className="text-sm font-black tabular-nums">
                    {CurrencyUtil.formatAmount(r.amount, r.currency ?? "INR")}
                  </p>
                )}
                {r.charged_at && (
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(r.charged_at), "d MMM yyyy")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
