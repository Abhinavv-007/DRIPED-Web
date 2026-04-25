"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Smartphone,
  ShieldCheck,
  Cpu,
  Mail,
  Eye,
  ArrowLeft,
  Download,
  CheckCircle2,
  Globe,
  AlertTriangle,
} from "lucide-react";

/**
 * APK is hosted as a GitHub Release asset (the binary is too large for git
 * itself but releases have no size cap). Update `APK_VERSION` + bump the
 * GitHub release tag to ship a new build.
 */
const APK_AVAILABLE = true;
const APK_VERSION = "v1.0.0";
const APK_PATH = `https://github.com/Abhinavv-007/DRIPED-Web/releases/download/${APK_VERSION}/driped-android.apk`;
const APK_FILENAME = "driped-android.apk";

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div
        className="border-b-2 px-4 py-4 md:px-8"
        style={{ borderColor: "var(--neo-ink)", background: "var(--card)" }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-foreground/80 hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back
          </Link>
          <span
            className="brutal-badge"
            style={{ background: "var(--neo-mint)", color: "var(--neo-ink)" }}
          >
            Android build
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-5xl space-y-12 px-4 py-10 md:px-8 md:py-16">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-start gap-6 md:flex-row md:items-center"
        >
          <div
            className="flex size-20 shrink-0 items-center justify-center rounded-2xl border-2"
            style={{
              borderColor: "var(--neo-ink)",
              background: "var(--neo-gold)",
              color: "var(--primary-foreground)",
              boxShadow: "4px 4px 0 var(--neo-ink)",
            }}
          >
            <Smartphone className="size-10" />
          </div>
          <div className="flex-1">
            <h1 className="font-heading text-3xl font-black tracking-tight md:text-5xl">
              Download Driped for Android
            </h1>
            <p className="mt-3 text-base font-semibold text-foreground/80 md:text-lg">
              Manage, detect, and understand your subscriptions with smarter
              on-device scanning.
            </p>
          </div>
        </motion.section>

        {/* Primary CTA */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="brutal-card flex flex-col items-start gap-4 p-6 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-foreground/60">
              Release
            </p>
            <p className="mt-1 text-xl font-black text-foreground">
              Driped {APK_VERSION} \u2022 Android 8.0+
            </p>
            <p className="mt-2 max-w-lg text-sm font-semibold text-foreground/75">
              Signed APK. Sign in with the same Google account you use on the
              web \u2014 subscriptions sync instantly.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
            {APK_AVAILABLE ? (
              <a
                href={APK_PATH}
                download={APK_FILENAME}
                className="brutal-btn inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm"
                style={{
                  background: "var(--neo-ink)",
                  color: "var(--neo-cream)",
                }}
              >
                <Download className="size-4" /> Download APK
              </a>
            ) : (
              <button
                disabled
                className="brutal-btn inline-flex cursor-not-allowed items-center justify-center gap-2 px-6 py-3.5 text-sm opacity-70"
                style={{ background: "var(--muted)", color: "var(--foreground)" }}
                title="APK coming soon"
              >
                <Download className="size-4" /> APK coming soon
              </button>
            )}
            <Link
              href="/"
              className="brutal-btn inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm"
              style={{ background: "var(--card)", color: "var(--foreground)" }}
            >
              <Globe className="size-4" /> Continue on Web
            </Link>
          </div>
        </motion.section>

        {!APK_AVAILABLE && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="brutal-card-flat flex items-start gap-3 p-4"
            style={{ background: "var(--neo-gold-soft)" }}
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[color:var(--warning)]" />
            <p className="text-sm font-semibold text-foreground">
              The Android APK is still in final testing. Drop your email to be
              notified when it's out \u2014 or just keep using the web app, it
              has everything except the on-device email scanner.
            </p>
          </motion.div>
        )}

        {/* Why Android */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="font-heading text-2xl font-black tracking-tight">
            Why Android is better for scanning
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            <FeatureCard
              icon={<Cpu className="size-5" />}
              title="On-device AI"
              description="The Android app runs a small LiteRT language model locally. Your inbox never leaves your phone."
              tone="lilac"
            />
            <FeatureCard
              icon={<Mail className="size-5" />}
              title="Smarter email triage"
              description="Filters out refunds, newsletters, and one-off purchases automatically. Only real subscription charges get surfaced."
              tone="mint"
            />
            <FeatureCard
              icon={<ShieldCheck className="size-5" />}
              title="You stay in control"
              description="Review every detected subscription before it's added. Nothing imports without your approval."
              tone="sky"
            />
          </div>
        </motion.section>

        {/* Privacy / control */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="brutal-card space-y-4 p-6"
        >
          <div className="flex items-center gap-3">
            <span
              className="flex size-10 items-center justify-center rounded-xl border-2"
              style={{
                borderColor: "var(--neo-ink)",
                background: "var(--neo-mint)",
                color: "var(--neo-ink)",
                boxShadow: "3px 3px 0 var(--neo-ink)",
              }}
            >
              <Eye className="size-5" />
            </span>
            <h2 className="font-heading text-xl font-black tracking-tight">
              Privacy by default
            </h2>
          </div>
          <ul className="grid gap-2.5 md:grid-cols-2">
            {[
              "On-device AI wherever possible \u2014 your emails don't hit our servers.",
              "No random imports. You review each detected subscription first.",
              "Only what you have proof of gets saved to your account.",
              "Read-only Gmail scope \u2014 Driped never sends or deletes email.",
            ].map((line) => (
              <li
                key={line}
                className="flex items-start gap-2 text-sm font-semibold text-foreground"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[color:var(--success)]" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </motion.section>

        {/* Install note */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="brutal-card-flat space-y-3 p-5"
        >
          <h3 className="font-heading text-sm font-black uppercase tracking-widest text-foreground/70">
            Install note
          </h3>
          <p className="text-sm font-semibold text-foreground/85">
            Because Driped isn't on the Play Store yet, Android may ask you to
            allow installs from your browser or file manager the first time.
            This is safe \u2014 the APK is signed with our own release key.
          </p>
          <p className="text-xs font-semibold text-foreground/60">
            Play Store release coming later.
          </p>
        </motion.section>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tone: "lilac" | "mint" | "sky";
}) {
  const bg = `var(--neo-${tone})`;
  return (
    <div
      className="brutal-card space-y-2 p-5"
    >
      <span
        className="flex size-10 items-center justify-center rounded-xl border-2"
        style={{
          borderColor: "var(--neo-ink)",
          background: bg,
          color: "var(--neo-ink)",
          boxShadow: "2px 2px 0 var(--neo-ink)",
        }}
      >
        {icon}
      </span>
      <h3 className="font-heading text-base font-black text-foreground">
        {title}
      </h3>
      <p className="text-sm font-semibold text-foreground/75">{description}</p>
    </div>
  );
}
