"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Lock, Smartphone, Sparkles } from "lucide-react";
import { signInWithGoogle } from "@/lib/firebase";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function ConnectPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);

  const handleConnect = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
      setAuthenticated(true);
      router.push("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-in failed";
      if (!msg.includes("popup-closed")) {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const TRUST_BADGES = [
    { icon: Shield, text: "Your data stays on your device", bg: "bg-[#D0FFE0]", color: "text-[#006B2B]" },
    { icon: Lock, text: "End-to-end encrypted sync", bg: "bg-[#D0E8FF]", color: "text-[#003D80]" },
    { icon: Smartphone, text: "Works across all your devices", bg: "bg-[#FFF3D0]", color: "text-[#7A5C00]" },
  ];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6">
      {/* Grid pattern background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Floating decorative shapes */}
      <motion.div
        className="pointer-events-none absolute left-[10%] top-[15%] h-16 w-16 rounded-lg border-2 border-foreground/10 bg-[#FFE0E0]"
        animate={{ rotate: [0, 10, -10, 0], y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{ boxShadow: "3px 3px 0px var(--foreground)" }}
      />
      <motion.div
        className="pointer-events-none absolute right-[12%] top-[20%] h-12 w-12 rounded-full border-2 border-foreground/10 bg-[#D0E8FF]"
        animate={{ rotate: [0, -15, 15, 0], y: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        style={{ boxShadow: "3px 3px 0px var(--foreground)" }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-[20%] left-[15%] h-10 w-10 border-2 border-foreground/10 bg-[#D0FFE0]"
        animate={{ rotate: [0, 45, 0], y: [0, -6, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        style={{ boxShadow: "3px 3px 0px var(--foreground)" }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-[25%] right-[10%] h-14 w-14 rounded-lg border-2 border-foreground/10 bg-[#FFF3D0]"
        animate={{ rotate: [0, -8, 8, 0], y: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        style={{ boxShadow: "3px 3px 0px var(--foreground)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex max-w-md flex-col items-center text-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, rotate: -5 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className="mb-8 flex h-24 w-24 items-center justify-center rounded-2xl border-3 border-foreground/80 bg-primary"
          style={{ boxShadow: "6px 6px 0px var(--foreground)" }}
        >
          <span className="text-4xl font-black tracking-tighter text-primary-foreground">D</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-black tracking-tight text-foreground md:text-4xl"
        >
          Connect your account
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-3 text-base font-medium text-muted-foreground"
        >
          Sign in with Google to sync your subscriptions across devices and
          enable Gmail scanning.
        </motion.p>

        {/* Google Sign-In Button */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ y: -2, boxShadow: "6px 6px 0px var(--foreground)" }}
          whileTap={{ y: 1, boxShadow: "2px 2px 0px var(--foreground)" }}
          onClick={handleConnect}
          disabled={busy}
          className="mt-8 flex h-14 w-full max-w-sm items-center justify-center gap-3 rounded-xl border-2 border-foreground/80 bg-white px-6 text-base font-black text-gray-800 transition-all disabled:opacity-60"
          style={{ boxShadow: "4px 4px 0px var(--foreground)" }}
        >
          {busy ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          {busy ? "Connecting..." : "Continue with Google"}
        </motion.button>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="brutal-card-flat mt-4 bg-[#FFE0E0] px-4 py-2 text-sm font-bold text-[#8B0000]"
          >
            {error}
          </motion.div>
        )}

        {/* Trust badges */}
        <div className="mt-10 flex flex-col gap-3 text-left">
          {TRUST_BADGES.map(({ icon: Icon, text, bg, color }, i) => (
            <motion.div
              key={text}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 border-foreground/60 ${bg}`}
                style={{ boxShadow: "2px 2px 0px var(--foreground)" }}
              >
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <span className="text-sm font-bold text-muted-foreground">{text}</span>
            </motion.div>
          ))}
        </div>

        {/* Sparkle tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 flex items-center gap-1.5 text-xs font-bold text-muted-foreground/60"
        >
          <Sparkles className="h-3 w-3" />
          Stop the drip. Take back control.
          <Sparkles className="h-3 w-3" />
        </motion.div>
      </motion.div>
    </div>
  );
}
