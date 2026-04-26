"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Smartphone, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "driped.banner.android.dismissedAt";
/** 14 days */
const DISMISS_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Dismissible banner that points users to the Android download page.
 * Honours localStorage so we don't nag the user more than once every 14 days.
 * Hidden entirely on the /download route to avoid redundancy.
 */
export function AndroidBanner() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    if (window.location.pathname.startsWith("/download")) return false;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return true;
    const dismissedAt = Number(raw);
    return !(Number.isFinite(dismissedAt) && Date.now() - dismissedAt < DISMISS_WINDOW_MS);
  });

  const dismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="relative z-20 border-b-2 px-4 py-2.5 md:px-6"
          style={{ borderColor: "var(--neo-ink)", background: "var(--neo-gold-soft)" }}
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-lg border-2"
              style={{
                borderColor: "var(--neo-ink)",
                background: "var(--neo-gold)",
                color: "var(--primary-foreground)",
              }}
            >
              <Smartphone className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-foreground">
                Android app available
              </p>
              <p className="text-xs font-semibold text-foreground/75">
                Smarter on-device subscription scanning \u2014 no server roundtrip.
              </p>
            </div>
            <Link
              href="/download"
              className="brutal-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
              style={{ background: "var(--neo-ink)", color: "var(--neo-cream)" }}
            >
              Download for Android <ArrowRight className="size-3" />
            </Link>
            <button
              onClick={dismiss}
              className="flex size-7 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground"
              aria-label="Dismiss Android banner"
            >
              <X className="size-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
