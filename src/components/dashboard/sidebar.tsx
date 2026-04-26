"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  Layers,
  BarChart3,
  CreditCard,
  User,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  PiggyBank,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/app-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { signOut } from "@/lib/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AnimatedLogo } from "@/components/shared/animated-logo";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/subscriptions", icon: Layers, label: "Subscriptions" },
  { href: "/savings", icon: PiggyBank, label: "Savings" },
  { href: "/forecast", icon: TrendingUp, label: "Forecast" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/payments", icon: CreditCard, label: "Payments" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const setCollapsed = useAppStore((s) => s.setSidebarCollapsed);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const user = useAuthStore((s) => s.user);

  const handleSignOut = async () => {
    await signOut();
    useAuthStore.getState().reset();
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="hidden md:flex h-screen flex-col border-r-2 border-foreground/80 bg-sidebar sticky top-0 shrink-0 overflow-hidden"
    >
      {/* Header */}
      <div className={cn("flex h-16 items-center gap-3 px-4", collapsed && "justify-center px-0")}>
        <AnimatedLogo size={36} />
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-lg font-black tracking-tight text-sidebar-foreground"
          >
            Driped
          </motion.span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 pt-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const item = (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-lg border-2 px-3 py-2.5 text-sm font-bold transition-all duration-150",
                active
                  ? "border-foreground/80 bg-primary/15 text-foreground"
                  : "border-transparent text-sidebar-foreground/70 hover:border-foreground/30 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  active ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
                )}
              />
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {label}
                </motion.span>
              )}
              {active && !collapsed && (
                <motion.div
                  layoutId="nav-indicator"
                  className="ml-auto h-2 w-2 rounded-sm bg-primary border border-foreground/50"
                  style={{ boxShadow: '1px 1px 0px var(--foreground)' }}
                />
              )}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={href}>
                <TooltipTrigger render={<span />}>{item}</TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            );
          }
          return item;
        })}
      </nav>

      {/* Footer */}
      <div className="space-y-1 border-t-2 border-foreground/20 px-3 py-3">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed && "justify-center px-0 text-sidebar-foreground/85"
          )}
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 shrink-0" />
          ) : (
            <Moon className="h-5 w-5 shrink-0" />
          )}
          {!collapsed && <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>}
        </button>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive",
            collapsed && "justify-center px-0 text-sidebar-foreground/85"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>

        {/* User */}
        {user && (
          <div className={cn("flex items-center gap-3 rounded-xl px-3 py-2", collapsed && "justify-center px-0")}>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={user.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary/20 text-xs font-bold text-primary">
                {(user.full_name ?? user.email)?.[0]?.toUpperCase() ?? "D"}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {user.full_name ?? "User"}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/50">
                  {user.email}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-xl py-2 text-sidebar-foreground/40 transition-colors hover:text-sidebar-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </motion.aside>
  );
}
