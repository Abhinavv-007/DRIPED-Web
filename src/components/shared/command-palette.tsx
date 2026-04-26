"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Layers, BarChart3, CreditCard, User, Plus,
  Moon, Sun, ScanSearch, LogOut, Search, Tag,
} from "lucide-react";
import { useAppStore } from "@/lib/stores/app-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { signOut } from "@/lib/firebase";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const go = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  const run = (fn: () => void | Promise<void>) => {
    fn();
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-[20vh] z-[100] w-[90vw] max-w-xl -translate-x-1/2"
          >
            <Command
              className="brutal-card overflow-hidden bg-card"
              style={{ boxShadow: "6px 6px 0px var(--foreground)" }}
            >
              <div className="flex items-center gap-2 border-b-2 border-foreground/20 px-4 py-3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Command.Input
                  placeholder="Search or jump to..."
                  className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
                  autoFocus
                />
                <span className="kbd">ESC</span>
              </div>

              <Command.List className="max-h-[60vh] overflow-y-auto p-2">
                <Command.Empty className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No results found.
                </Command.Empty>

                <Command.Group heading="Navigate" className="mb-2">
                  <Item icon={<Home className="h-4 w-4" />} label="Home" shortcut="G H" onSelect={() => go("/")} />
                  <Item icon={<Layers className="h-4 w-4" />} label="Subscriptions" shortcut="G S" onSelect={() => go("/subscriptions")} />
                  <Item icon={<BarChart3 className="h-4 w-4" />} label="Analytics" shortcut="G A" onSelect={() => go("/analytics")} />
                  <Item icon={<CreditCard className="h-4 w-4" />} label="Payments" shortcut="G P" onSelect={() => go("/payments")} />
                  <Item icon={<Tag className="h-4 w-4" />} label="Categories" shortcut="G C" onSelect={() => go("/categories")} />
                  <Item icon={<User className="h-4 w-4" />} label="Profile" shortcut="G U" onSelect={() => go("/profile")} />
                </Command.Group>

                <Command.Group heading="Actions">
                  <Item
                    icon={<Plus className="h-4 w-4 text-primary" />}
                    label="Add Subscription"
                    shortcut="N"
                    onSelect={() => go("/subscriptions?add=true")}
                  />
                  <Item
                    icon={<ScanSearch className="h-4 w-4 text-info" />}
                    label="Scan Gmail for Subscriptions"
                    onSelect={() => go("/profile#scan")}
                  />
                  <Item
                    icon={theme === "dark" ? <Sun className="h-4 w-4 text-warning" /> : <Moon className="h-4 w-4 text-info" />}
                    label={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
                    onSelect={() => run(toggleTheme)}
                  />
                  <Item
                    icon={<LogOut className="h-4 w-4 text-danger" />}
                    label="Sign Out"
                    onSelect={() => run(async () => {
                      await signOut();
                      useAuthStore.getState().reset();
                    })}
                  />
                </Command.Group>
              </Command.List>

              <div className="border-t-2 border-foreground/20 bg-muted/40 px-4 py-2 text-[10px] font-bold text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="kbd">↑</span><span className="kbd">↓</span> navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="kbd">↵</span> select
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="kbd">⌘K</span> toggle
                  </span>
                </div>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Item({
  icon,
  label,
  shortcut,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold aria-selected:bg-primary/15 aria-selected:text-foreground hover:bg-accent/60"
    >
      {icon}
      <span className="flex-1">{label}</span>
      {shortcut && (
        <div className="flex gap-1">
          {shortcut.split(" ").map((k) => (
            <span key={k} className="kbd">{k}</span>
          ))}
        </div>
      )}
    </Command.Item>
  );
}
