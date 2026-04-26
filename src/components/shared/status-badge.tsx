"use client";

import { cn } from "@/lib/utils";
import type { SubscriptionStatus } from "@/lib/models/types";

const STATUS_STYLES: Record<SubscriptionStatus, string> = {
  active: "bg-[#D0FFE0] text-[#006B2B] border-foreground/70",
  trial: "bg-[#FFF3D0] text-[#7A5C00] border-foreground/70",
  paused: "bg-[#D0E8FF] text-[#003D80] border-foreground/70",
  cancelled: "bg-[#FFE0E0] text-[#8B0000] border-foreground/70",
  archived: "bg-muted text-muted-foreground border-foreground/50",
};

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: "Active",
  trial: "Trial",
  paused: "Paused",
  cancelled: "Cancelled",
  archived: "Archived",
};

export function StatusBadge({
  status,
  className,
}: {
  status: SubscriptionStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border-2 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider",
        STATUS_STYLES[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
