"use client";

import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { MobileFab } from "./mobile-fab";
import { CommandPalette } from "@/components/shared/command-palette";
import { AndroidBanner } from "@/components/shared/android-banner";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-28 md:pb-0">
        <AndroidBanner />
        {children}
      </main>
      <MobileNav />
      <MobileFab />
      <CommandPalette />
    </div>
  );
}
