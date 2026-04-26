"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppUser } from "@/lib/models/types";

interface AuthState {
  user: AppUser | null;
  isAuthenticated: boolean;
  onboardingComplete: boolean;
  isLoading: boolean;

  setUser: (user: AppUser | null) => void;
  setAuthenticated: (val: boolean) => void;
  setOnboardingComplete: (val: boolean) => void;
  setLoading: (val: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      onboardingComplete: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),
      setLoading: (isLoading) => set({ isLoading }),
      reset: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }),
    }),
    {
      name: "driped-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        onboardingComplete: state.onboardingComplete,
      }),
    }
  )
);
