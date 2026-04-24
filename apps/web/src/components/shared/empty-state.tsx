"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

type EmptyTone = "gold" | "blue" | "green" | "red";

const toneClass: Record<EmptyTone, string> = {
  gold: "bg-[#FFF3D0] text-[#7A5C00]",
  blue: "bg-[#D0E8FF] text-[#003D80]",
  green: "bg-[#D0FFE0] text-[#006B2B]",
  red: "bg-[#FFE0E0] text-[#8B0000]",
};

export function IllustratedEmptyState({
  icon: Icon,
  title,
  description,
  children,
  tone = "gold",
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
  tone?: EmptyTone;
  className?: string;
}) {
  return (
    <Empty
      className={cn(
        "relative overflow-hidden border-2 border-dashed border-foreground/45 py-12",
        className
      )}
    >
      <motion.div
        aria-hidden
        className="absolute left-8 top-8 size-4 rounded-sm border-2 border-foreground/25 bg-primary/25"
        initial={{ opacity: 0, rotate: -8, scale: 0.85 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute bottom-10 right-10 size-5 rounded-full border-2 border-foreground/20 bg-accent"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.08, ease: "easeOut" }}
      />
      <EmptyHeader>
        <EmptyMedia variant="default">
          <motion.div
            className={cn(
              "flex size-20 items-center justify-center rounded-2xl border-2 border-foreground/80",
              toneClass[tone]
            )}
            style={{ boxShadow: "5px 5px 0px var(--foreground)" }}
            initial={{ opacity: 0, y: 8, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 18 }}
            whileHover={{ y: -2, rotate: -1 }}
          >
            <Icon className="size-9" strokeWidth={1.8} />
          </motion.div>
        </EmptyMedia>
        <EmptyTitle className="text-lg font-black">{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {children && <EmptyContent>{children}</EmptyContent>}
    </Empty>
  );
}
