"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  theme: "light" | "dark";
  preferredCurrency: string;
  sidebarCollapsed: boolean;

  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
  setPreferredCurrency: (currency: string) => void;
  setSidebarCollapsed: (val: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      preferredCurrency: "INR",
      sidebarCollapsed: false,

      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== "undefined") {
          document.documentElement.classList.toggle("dark", theme === "dark");
        }
      },
      toggleTheme: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        get().setTheme(next);
      },
      setPreferredCurrency: (preferredCurrency) => set({ preferredCurrency }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
    }),
    {
      name: "driped-app",
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== "undefined") {
          document.documentElement.classList.toggle("dark", state.theme === "dark");
        }
      },
    }
  )
);
