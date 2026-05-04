"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type NeoStatColor = "mint" | "coral" | "sky" | "lilac" | "lemon" | "gold";

export interface StatTileProps {
  label: string;
  value: string;
  delta?: string;
  deltaDirection?: "up" | "down" | "flat";
  icon?: React.ReactNode;
  tone?: NeoStatColor;
  delay?: number;
  className?: string;
}

const TONE_CLASS: Record<NeoStatColor, string> = {
  mint:  "brutal-stat--mint",
  coral: "brutal-stat--coral",
  sky:   "brutal-stat--sky",
  lilac: "brutal-stat--lilac",
  lemon: "brutal-stat--lemon",
  gold:  "brutal-stat--gold",
};

export function StatTile({
  label,
  value,
  delta,
  deltaDirection = "flat",
  icon,
  tone = "gold",
  delay = 0,
  className,
}: StatTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn("brutal-stat flex flex-col gap-2", TONE_CLASS[tone], className)}
    >
      <div className="flex items-center gap-2">
        {icon && <span className="size-5">{icon}</span>}
        <span className="font-heading text-[10px] font-black uppercase tracking-[0.16em] opacity-80">
          {label}
        </span>
      </div>
      <p className="font-heading text-2xl font-black tracking-tight md:text-3xl tabular-nums">
        {value}
      </p>
      {delta && (
        <p className={cn(
          "text-xs font-semibold",
          deltaDirection === "up"   && "text-[color:var(--success)]",
          deltaDirection === "down" && "text-[color:var(--danger)]",
          deltaDirection === "flat" && "opacity-70",
        )}>
          {deltaDirection === "up" ? "↑ " : deltaDirection === "down" ? "↓ " : ""}
          {delta}
        </p>
      )}
    </motion.div>
  );
}
