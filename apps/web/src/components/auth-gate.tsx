"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { api } from "@/lib/api/client";
import type { AppUser } from "@/lib/models/types";

const PUBLIC_PATHS = ["/onboarding", "/connect"];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const onboardingComplete = useAuthStore((s) => s.onboardingComplete);
  const setUser = useAuthStore((s) => s.setUser);
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);

  // Firebase listener — runs once, updates store in background
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    import("@/lib/firebase").then(({ auth, onAuthStateChanged }) => {
      unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        if (fbUser) {
          const localUser: AppUser = {
            id: fbUser.uid,
            email: fbUser.email ?? "",
            full_name: fbUser.displayName ?? "",
            avatar_url: fbUser.photoURL ?? null,
            currency: "INR",
            created_at: new Date().toISOString(),
          };
          setUser(localUser);

          // Sync with backend (non-blocking)
          api.post<AppUser>("/users/sync", {
            email: fbUser.email,
            full_name: fbUser.displayName,
            avatar_url: fbUser.photoURL,
          }).then((res) => {
            if (res.data) setUser(res.data);
          }).catch(() => {});
        } else {
          setUser(null);
          setAuthenticated(false);
        }
      });
    }).catch(() => {});

    return () => unsubscribe?.();
  }, [setUser, setAuthenticated]);

  // Redirect logic — runs on every relevant state change
  useEffect(() => {
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

    if (!onboardingComplete && pathname !== "/onboarding") {
      router.replace("/onboarding");
      return;
    }

    if (onboardingComplete && !isAuthenticated && !isPublic) {
      router.replace("/connect");
      return;
    }

    if (isAuthenticated && isPublic) {
      router.replace("/");
      return;
    }
  }, [isAuthenticated, onboardingComplete, pathname, router]);

  // No loading gate — render children immediately
  return <>{children}</>;
}
