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
  ExternalLink,
  Sparkles,
} from "lucide-react";

/**
 * APK is hosted as a GitHub Release asset (the binary is too large for git
 * itself but releases have no size cap). Update `APK_VERSION` + bump the
 * GitHub release tag to ship a new build.
 */
const APK_AVAILABLE = true;
const APK_VERSION = "v3.1.1";
const APK_PATH = `https://github.com/Abhinavv-007/DRIPED-Web/releases/download/${APK_VERSION}/driped-android.apk`;
const APK_FILENAME = "driped-android.apk";
const RELEASES_URL = "https://github.com/Abhinavv-007/DRIPED-Web/releases";

interface ReleaseEntry {
  version: string;
  date: string;
  channel: "internal" | "alpha" | "beta" | "rc" | "public";
  title: string;
  notes: string[];
}

/**
 * Release timeline shown on the download page. Only `v3.1.1` exists as a
 * public GitHub Release \u2014 earlier entries document internal alpha / beta
 * milestones during 2024\u20132026. Kept honest in the channel labels.
 */
const RELEASE_TIMELINE: ReleaseEntry[] = [
  {
    version: "v0.1.0",
    date: "Apr 2024",
    channel: "internal",
    title: "Project genesis",
    notes: [
      "Riverpod skeleton, Firebase Auth wiring.",
      "First subscription model + currency seed.",
    ],
  },
  {
    version: "v0.2.0",
    date: "May 2024",
    channel: "internal",
    title: "Local cache + offline drafts",
    notes: [
      "Hive box for subscriptions; offline-first save flow.",
      "Manual add-subscription form with category picker.",
    ],
  },
  {
    version: "v0.5.0",
    date: "Jun 2024",
    channel: "internal",
    title: "Gmail OAuth groundwork",
    notes: [
      "Gmail read-only scope, token refresh, account linking.",
      "First receipt-list view (no parsing yet).",
    ],
  },
  {
    version: "v0.7.0",
    date: "Jul 2024",
    channel: "internal",
    title: "Sender-domain detection",
    notes: [
      "Recognises ~30 brands from `From` header alone.",
      "Receipt-vs-newsletter classifier (regex + scoring).",
    ],
  },
  {
    version: "v1.0.0-alpha",
    date: "Aug 2024",
    channel: "alpha",
    title: "Cloudflare Worker baseline",
    notes: [
      "First Worker deployment + D1 schema v1.",
      "Server-side dedup; first multi-device sync.",
    ],
  },
  {
    version: "v1.2.0-alpha",
    date: "Sep 2024",
    channel: "alpha",
    title: "Spend insights",
    notes: [
      "Charge-method tracking (UPI, card, PayPal\u2026).",
      "Naive savings estimate based on cycle vs duration.",
    ],
  },
  {
    version: "v1.5.0-alpha",
    date: "Oct 2024",
    channel: "alpha",
    title: "Renewal reminders",
    notes: [
      "Local notifications scheduled per upcoming charge.",
      "Boot-completed receiver to survive reboots.",
    ],
  },
  {
    version: "v1.8.0-alpha",
    date: "Dec 2024",
    channel: "alpha",
    title: "Multi-currency",
    notes: [
      "FX rate cache (24 h), per-user display currency.",
      "Spend totals across mixed-currency subscriptions.",
    ],
  },
  {
    version: "v2.0.0-beta",
    date: "Jan 2025",
    channel: "beta",
    title: "Forecast & price history",
    notes: [
      "fl_chart-based 12-month spend forecast.",
      "`price_history` table for tracking plan changes.",
    ],
  },
  {
    version: "v2.1.0-beta",
    date: "Feb 2025",
    channel: "beta",
    title: "Scan dedup + audit",
    notes: [
      "Per-email fingerprint, `scan_log` table.",
      "Avoid duplicate detections across re-scans.",
    ],
  },
  {
    version: "v2.3.0-beta",
    date: "Mar 2025",
    channel: "beta",
    title: "Web companion",
    notes: [
      "Next.js + Tailwind v4 web app reaches feature parity.",
      "Same Worker backs both surfaces.",
    ],
  },
  {
    version: "v2.5.0-beta",
    date: "Apr 2025",
    channel: "beta",
    title: "On-device LiteRT-LM",
    notes: [
      "Bundled `mobile-actions q8` LiteRT model on Android.",
      "Runs as last-resort extractor for ambiguous emails.",
    ],
  },
  {
    version: "v2.7.0-beta",
    date: "May 2025",
    channel: "beta",
    title: "Push notifications",
    notes: [
      "Web Push + FCM bridge for upcoming-charge alerts.",
      "`push_subscriptions` table; per-device unsubscribe.",
    ],
  },
  {
    version: "v2.9.0-rc",
    date: "Aug 2025",
    channel: "rc",
    title: "Insights revamp",
    notes: [
      "Savings + spend-by-category dashboards.",
      "`insights` Worker route; cached aggregates.",
    ],
  },
  {
    version: "v3.0.0-rc",
    date: "Oct 2025",
    channel: "rc",
    title: "Brand registry + shared scan engine",
    notes: [
      "200+ merchants in seed registry.",
      "Single `@driped/scan` package shared across web + mobile.",
    ],
  },
  {
    version: "v3.0.5-rc",
    date: "Jan 2026",
    channel: "rc",
    title: "V2 schema migration",
    notes: [
      "`scan_feedback`, `receipt_refs`, `auth_sessions` tables.",
      "Ground truth pipeline for future model training.",
    ],
  },
  {
    version: "v3.1.0-rc",
    date: "Mar 2026",
    channel: "rc",
    title: "Custom API domain + AI cache",
    notes: [
      "API moves to `api.driped.in` with KV-cached extractions.",
      "24 h cache per email-hash; 100 ext/min/user rate limit.",
    ],
  },
  {
    version: "v3.1.1",
    date: "Apr 2026",
    channel: "public",
    title: "First public release",
    notes: [
      "Replaced 270\u202fMB on-device LiteRT model with Llama 3.1 8B Worker fallback.",
      "APK now ~80\u202fMB instead of ~650\u202fMB.",
      "Cross-platform scan parity \u2014 web + Android run the same pipeline.",
    ],
  },
];

const CHANNEL_STYLES: Record<
  ReleaseEntry["channel"],
  { label: string; bg: string; fg: string }
> = {
  internal: { label: "Internal", bg: "var(--muted)", fg: "var(--foreground)" },
  alpha: { label: "Alpha", bg: "var(--neo-lilac)", fg: "var(--neo-ink)" },
  beta: { label: "Beta", bg: "var(--neo-sky)", fg: "var(--neo-ink)" },
  rc: { label: "RC", bg: "var(--neo-mint)", fg: "var(--neo-ink)" },
  public: { label: "Public", bg: "var(--neo-gold)", fg: "var(--neo-ink)" },
};

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
              Manage, detect and forecast every recurring charge in your inbox
              \u2014 with a scan engine that&apos;s identical to the web app.
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
              Latest Release
            </p>
            <p className="mt-1 text-xl font-black text-foreground">
              Driped {APK_VERSION} \u2022 Android 8.0+
            </p>
            <p className="mt-2 max-w-lg text-sm font-semibold text-foreground/75">
              Signed APK, ~80\u202fMB. Sign in with the same Google account you
              use on the web \u2014 your subscriptions sync instantly.
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
              notified when it&apos;s out \u2014 or just keep using the web app,
              it has everything except the on-device email scanner.
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
            Why install the app
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            <FeatureCard
              icon={<Cpu className="size-5" />}
              title="Two-tier scan engine"
              description="A deterministic local parser handles 85% of receipts on-device. Only ambiguous ones escalate to a Llama-3.1-8B fallback over HTTPS."
              tone="lilac"
            />
            <FeatureCard
              icon={<Mail className="size-5" />}
              title="Smarter email triage"
              description="Filters out refunds, newsletters and one-off purchases. Only real recurring charges get surfaced \u2014 with full body context, not just metadata."
              tone="mint"
            />
            <FeatureCard
              icon={<ShieldCheck className="size-5" />}
              title="You stay in control"
              description="Review every detected subscription before it&apos;s added. Renewal reminders, push alerts, multi-currency totals \u2014 all opt-in."
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
              "Read-only Gmail scope \u2014 Driped never sends or deletes email.",
              "Local parser handles ~85% of emails. Only low-confidence ones hit the AI fallback.",
              "AI fallback runs on Cloudflare Workers AI; no per-user audit log retained.",
              "Nothing imports without your approval. Review every detection first.",
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

        {/* Release timeline */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-2xl font-black tracking-tight">
              Release timeline
            </h2>
            <a
              href={RELEASES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="brutal-btn inline-flex items-center gap-2 px-3 py-2 text-xs"
              style={{ background: "var(--card)", color: "var(--foreground)" }}
            >
              <ExternalLink className="size-3.5" /> All releases
            </a>
          </div>
          <p className="text-sm font-semibold text-foreground/70">
            Two years of internal alpha &rarr; beta &rarr; RC builds shipped to
            our test rig before <strong>v3.1.1</strong> went public on GitHub
            Releases. Older builds are documented here but were never published.
          </p>
          <ol className="relative space-y-3 border-l-2 pl-5"
            style={{ borderColor: "var(--neo-ink)" }}
          >
            {RELEASE_TIMELINE.slice().reverse().map((entry, idx) => {
              const ch = CHANNEL_STYLES[entry.channel];
              const isLatest = idx === 0;
              return (
                <li key={entry.version} className="relative">
                  <span
                    className="absolute -left-[1.78rem] top-2 size-3 rounded-full border-2"
                    style={{
                      background: isLatest ? "var(--neo-gold)" : "var(--card)",
                      borderColor: "var(--neo-ink)",
                    }}
                  />
                  <div
                    className={`brutal-card-flat space-y-2 p-4 ${
                      isLatest ? "border-2" : ""
                    }`}
                    style={
                      isLatest
                        ? {
                            background: "var(--neo-gold-soft)",
                            borderColor: "var(--neo-ink)",
                          }
                        : undefined
                    }
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-black">
                        {entry.version}
                      </span>
                      <span className="text-xs font-bold text-foreground/60">
                        \u2022 {entry.date}
                      </span>
                      <span
                        className="brutal-badge text-[10px]"
                        style={{ background: ch.bg, color: ch.fg }}
                      >
                        {ch.label}
                      </span>
                      {isLatest && (
                        <span
                          className="brutal-badge inline-flex items-center gap-1 text-[10px]"
                          style={{
                            background: "var(--neo-ink)",
                            color: "var(--neo-cream)",
                          }}
                        >
                          <Sparkles className="size-3" /> Latest
                        </span>
                      )}
                    </div>
                    <p className="font-heading text-sm font-black text-foreground">
                      {entry.title}
                    </p>
                    <ul className="space-y-1 text-xs font-semibold text-foreground/75">
                      {entry.notes.map((note) => (
                        <li key={note} className="flex items-start gap-1.5">
                          <span className="mt-1 size-1 shrink-0 rounded-full bg-current opacity-60" />
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>
        </motion.section>

        {/* Install note */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="brutal-card-flat space-y-3 p-5"
        >
          <h3 className="font-heading text-sm font-black uppercase tracking-widest text-foreground/70">
            Install note
          </h3>
          <p className="text-sm font-semibold text-foreground/85">
            Because Driped isn&apos;t on the Play Store yet, Android may ask
            you to allow installs from your browser or file manager the first
            time. This is safe \u2014 the APK is signed with our own release
            key. Play Store release coming later.
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
    <div className="brutal-card space-y-2 p-5">
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
