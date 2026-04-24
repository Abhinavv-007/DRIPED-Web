"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Layers, BarChart3, CreditCard, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/subscriptions", icon: Layers, label: "Subs" },
  { href: "/analytics", icon: BarChart3, label: "Stats" },
  { href: "/payments", icon: CreditCard, label: "Pay" },
  { href: "/profile", icon: User, label: "Me" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div
        className="mx-3 mb-3 flex items-center rounded-xl border-2 border-foreground/80 bg-background px-1 py-1"
        style={{ boxShadow: "3px 3px 0px var(--foreground)" }}
      >
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-2 transition-all",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {active && (
                <motion.div
                  layoutId="mobile-nav-active"
                  className="absolute inset-0 rounded-lg border-2 border-foreground/60 bg-primary/15"
                  style={{ boxShadow: "inset 0 0 0 1px var(--primary)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                className={cn(
                  "relative z-10 h-5 w-5 transition-transform",
                  active ? "text-primary scale-110" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "relative z-10 text-[9px] font-black uppercase tracking-wider",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
