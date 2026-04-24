"use client";

import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGmailAccessToken } from "@/lib/firebase";
import { SERVICE_MAP, POPULAR_SERVICES, normalizeServiceSlug } from "@/lib/constants/services";
import type { BillingCycle } from "@/lib/models/types";

const GMAIL_API = "https://www.googleapis.com/gmail/v1/users/me";

const SCAN_QUERIES = [
  '(receipt OR invoice OR "payment confirmation" OR "payment receipt" OR "tax invoice" OR billing OR charged OR paid)',
  '(subscription OR membership OR recurring OR "auto-renew") (receipt OR invoice OR billing OR payment)',
  '("renews on" OR "renewal date" OR "next billing" OR "next payment" OR "next charge")',
  '(from:googleplay-noreply@google.com OR from:payments-noreply@google.com OR from:no_reply@email.apple.com) (subscription OR receipt)',
];

export interface DetectedSub {
  serviceName: string;
  serviceSlug: string;
  amount: number | null;
  currency: string;
  billingCycle: BillingCycle;
  startDate: string | null;
  nextRenewalDate: string | null;
  emailSubject: string;
  emailDate: string | null;
}

export interface ScanState {
  status: "idle" | "scanning" | "done" | "error";
  progress: string;
  phase: string;
  emailsScanned: number;
  subscriptionsFound: number;
  foundServices: DetectedSub[];
  error: string | null;
}

const initialState: ScanState = {
  status: "idle",
  progress: "",
  phase: "",
  emailsScanned: 0,
  subscriptionsFound: 0,
  foundServices: [],
  error: null,
};

// Build a lookup of sender domains → service slug from the registry
const DOMAIN_TO_SLUG = new Map<string, string>();
const KEYWORD_SLUGS: { keywords: string[]; slug: string; name: string }[] = [];

// Populate from POPULAR_SERVICES + Flutter pattern knowledge
const KNOWN_DOMAINS: Record<string, string> = {
  "netflix.com": "netflix", "spotify.com": "spotify", "apple.com": "apple_music",
  "amazon.in": "amazon_prime", "amazon.com": "amazon_prime", "google.com": "google_one",
  "youtube.com": "youtube_premium", "notion.so": "notion", "figma.com": "figma",
  "slack.com": "slack", "github.com": "github_pro", "openai.com": "chatgpt_plus",
  "anthropic.com": "claude_pro", "canva.com": "canva", "adobe.com": "adobe_cc",
  "dropbox.com": "dropbox", "zoom.us": "zoom", "microsoft.com": "microsoft_365",
  "hotstar.com": "disney_hotstar", "vercel.com": "vercel", "digitalocean.com": "digitalocean",
  "cloudflare.com": "cloudflare", "supabase.com": "supabase", "railway.app": "railway",
  "netlify.com": "netlify", "discord.com": "discord_nitro", "hulu.com": "hulu",
  "crunchyroll.com": "crunchyroll", "perplexity.ai": "perplexity_pro",
  "grammarly.com": "grammarly", "linear.app": "linear", "todoist.com": "todoist",
  "duolingo.com": "duolingo_super", "headspace.com": "headspace", "medium.com": "medium",
  "substack.com": "substack", "patreon.com": "patreon", "swiggy.in": "swiggy_one",
  "zomato.com": "zomato_gold", "1password.com": "onepassword", "proton.me": "proton",
  "xbox.com": "xbox_game_pass", "playstation.com": "playstation_plus",
  "cult.fit": "cultfit", "coursera.org": "coursera_plus",
  "googleplay-noreply@google.com": "google_one",
  "payments-noreply@google.com": "google_one",
  "no_reply@email.apple.com": "apple_tv",
};

for (const [domain, slug] of Object.entries(KNOWN_DOMAINS)) {
  DOMAIN_TO_SLUG.set(domain, slug);
}

for (const svc of POPULAR_SERVICES) {
  KEYWORD_SLUGS.push({ keywords: [svc.name.toLowerCase(), svc.slug.replace(/_/g, " ")], slug: svc.slug, name: svc.name });
}

// Amount extraction
const AMOUNT_PATTERNS = [
  /₹\s*([\d,]+(?:\.\d{1,2})?)/,
  /INR\s*([\d,]+(?:\.\d{1,2})?)/i,
  /Rs\.?\s*([\d,]+(?:\.\d{1,2})?)/i,
  /\$\s*([\d,]+(?:\.\d{1,2})?)/,
  /USD\s*([\d,]+(?:\.\d{1,2})?)/i,
  /€\s*([\d,]+(?:\.\d{1,2})?)/,
  /£\s*([\d,]+(?:\.\d{1,2})?)/,
];

function extractAmount(text: string): { amount: number; currency: string } | null {
  for (const pat of AMOUNT_PATTERNS) {
    const m = pat.exec(text);
    if (m) {
      const amt = parseFloat(m[1].replace(/,/g, ""));
      if (amt > 0 && amt < 100000) {
        const currency = text.includes("₹") || /INR|Rs/i.test(text) ? "INR" : text.includes("€") ? "EUR" : text.includes("£") ? "GBP" : "USD";
        return { amount: amt, currency };
      }
    }
  }
  return null;
}

const MONTH_NUMBERS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

const RENEWAL_PATTERNS = [
  /(renews? on|next billing date|next payment date|renews? at|valid till|next billing|renewal date)\s*[:\-]?\s*([^\n\r<]{4,40})/i,
  /(next charge|upcoming charge|next invoice)\s*[:\-]?\s*([^\n\r<]{4,40})/i,
];

function normaliseBillingCycle(value?: string): BillingCycle {
  return value === "weekly" || value === "monthly" || value === "quarterly" || value === "yearly" || value === "lifetime"
    ? value
    : "monthly";
}

function detectBillingCycle(text: string, fallback: BillingCycle): BillingCycle {
  const lower = text.toLowerCase();
  if (/\b(one[\s-]?time|lifetime)\b/.test(lower)) return "lifetime";
  if (/\b(quarterly|every 3 months|once every 3 months)\b/.test(lower)) return "quarterly";
  if (/\b(yearly|annual|annually|per year|every year)\b|\/yr\b/.test(lower)) return "yearly";
  if (/\b(weekly|per week|every week)\b/.test(lower)) return "weekly";
  if (/\b(monthly|per month|every month)\b|\/mo\b/.test(lower)) return "monthly";
  return fallback;
}

function extractRenewalDate(text: string): Date | null {
  for (const pattern of RENEWAL_PATTERNS) {
    const match = pattern.exec(text);
    if (!match?.[2]) continue;
    const parsed = extractDate(match[2]);
    if (parsed) return parsed;
  }
  return null;
}

function extractDate(value: string): Date | null {
  const text = value.trim();
  const patterns = [
    /(\d{4})-(\d{2})-(\d{2})/,
    /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*(?:\s+(\d{4}))?/i,
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?/i,
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (!match) continue;

    if (pattern === patterns[0]) {
      const parsed = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00`);
      if (!Number.isNaN(parsed.getTime())) return startOfDay(parsed);
      continue;
    }

    if (pattern === patterns[1]) {
      const day = Number(match[1]);
      const month = MONTH_NUMBERS[match[2].toLowerCase()];
      const year = match[3] ? Number(match[3]) : inferYear(month, day);
      const parsed = new Date(year, month - 1, day);
      if (!Number.isNaN(parsed.getTime())) return startOfDay(parsed);
      continue;
    }

    if (pattern === patterns[2]) {
      const month = MONTH_NUMBERS[match[1].toLowerCase()];
      const day = Number(match[2]);
      const year = match[3] ? Number(match[3]) : inferYear(month, day);
      const parsed = new Date(year, month - 1, day);
      if (!Number.isNaN(parsed.getTime())) return startOfDay(parsed);
      continue;
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const parsed = new Date(year, month - 1, day);
    if (!Number.isNaN(parsed.getTime())) return startOfDay(parsed);
  }

  const fallback = new Date(text);
  return Number.isNaN(fallback.getTime()) ? null : startOfDay(fallback);
}

function inferYear(month: number, day: number) {
  const now = new Date();
  const candidate = new Date(now.getFullYear(), month - 1, day);
  return candidate < startOfDay(now) ? now.getFullYear() + 1 : now.getFullYear();
}

function parseEmailDate(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : startOfDay(parsed);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addMonths(date: Date, months: number) {
  const totalMonths = date.getFullYear() * 12 + date.getMonth() + months;
  const year = Math.floor(totalMonths / 12);
  const month = totalMonths % 12;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const day = Math.min(date.getDate(), lastDay);
  return new Date(year, month, day);
}

function inferNextRenewal(cycle: BillingCycle, chargeDate: Date | null) {
  if (cycle === "lifetime") return null;
  const base = chargeDate ? startOfDay(chargeDate) : startOfDay(new Date());
  const today = startOfDay(new Date());
  let cursor = base;
  let guard = 0;

  while (cursor < today && guard < 120) {
    switch (cycle) {
      case "weekly":
        cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7);
        break;
      case "monthly":
        cursor = addMonths(cursor, 1);
        break;
      case "quarterly":
        cursor = addMonths(cursor, 3);
        break;
      case "yearly":
        cursor = new Date(cursor.getFullYear() + 1, cursor.getMonth(), cursor.getDate());
        break;
    }
    guard += 1;
  }

  return cursor;
}

function resolveRenewalDate(explicitDate: Date | null, cycle: BillingCycle, chargeDate: Date | null) {
  const today = startOfDay(new Date());
  if (explicitDate && explicitDate >= today) return explicitDate;
  return inferNextRenewal(cycle, chargeDate);
}

function toDateInput(date: Date | null) {
  if (!date) return null;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function identifyService(from: string, subject: string, snippet: string): string | null {
  const fromLower = from.toLowerCase();
  const combined = `${subject} ${snippet}`.toLowerCase();

  // Check sender domains
  for (const [domain, slug] of DOMAIN_TO_SLUG) {
    if (fromLower.includes(domain)) return slug;
  }

  // Check keywords in subject/snippet
  for (const { keywords, slug } of KEYWORD_SLUGS) {
    if (keywords.some((kw) => combined.includes(kw))) return slug;
  }

  return null;
}

export function useGmailScan() {
  const [state, setState] = useState<ScanState>(initialState);
  const qc = useQueryClient();
  const abortRef = useRef(false);

  const startScan = useCallback(async () => {
    abortRef.current = false;
    setState({ ...initialState, status: "scanning", progress: "Getting Gmail access...", phase: "auth" });

    try {
      const accessToken = await getGmailAccessToken();
      if (!accessToken) {
        throw new Error("Could not get Gmail access. Please sign in again with Google.");
      }

      const headers = { Authorization: `Bearer ${accessToken}`, Accept: "application/json" };

      // Phase 1: Collect message IDs from all queries
      setState((s) => ({ ...s, progress: "Building email index...", phase: "indexing" }));
      const seenIds = new Set<string>();
      const messageIds: string[] = [];

      for (const query of SCAN_QUERIES) {
        if (abortRef.current) break;
        try {
          const url = `${GMAIL_API}/messages?q=${encodeURIComponent(query)}&maxResults=200`;
          const res = await fetch(url, { headers });
          if (!res.ok) {
            if (res.status === 403 || res.status === 401) {
              throw new Error("Gmail access denied. Please re-authenticate with Google.");
            }
            continue;
          }
          const data = await res.json();
          if (data.messages) {
            for (const msg of data.messages) {
              if (msg.id && !seenIds.has(msg.id)) {
                seenIds.add(msg.id);
                messageIds.push(msg.id);
              }
            }
          }
        } catch (err) {
          if (err instanceof Error && err.message.includes("access denied")) throw err;
        }
      }

      if (messageIds.length === 0) {
        setState({ status: "done", progress: "No subscription emails found", phase: "done", emailsScanned: 0, subscriptionsFound: 0, foundServices: [], error: null });
        return;
      }

      // Phase 2: Fetch and analyze messages in batches
      setState((s) => ({ ...s, progress: `Analyzing ${messageIds.length} emails...`, phase: "analyzing" }));
      const detected = new Map<string, DetectedSub>();
      let scanned = 0;
      const batchSize = 8;

      for (let i = 0; i < messageIds.length; i += batchSize) {
        if (abortRef.current) break;
        const batch = messageIds.slice(i, i + batchSize);

        const results = await Promise.allSettled(
          batch.map(async (id) => {
            const url = `${GMAIL_API}/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`;
            const res = await fetch(url, { headers });
            if (!res.ok) return null;
            return res.json();
          })
        );

        for (const result of results) {
          if (result.status !== "fulfilled" || !result.value) continue;
          const msg = result.value;
          const hdrs = msg.payload?.headers ?? [];
          let from = "", subject = "", date = "";
          for (const h of hdrs) {
            if (h.name === "From") from = h.value ?? "";
            if (h.name === "Subject") subject = h.value ?? "";
            if (h.name === "Date") date = h.value ?? "";
          }
          const snippet = msg.snippet ?? "";

          const rawSlug = identifyService(from, subject, snippet);
          const slug = rawSlug ? normalizeServiceSlug(rawSlug) : null;
          if (slug && !detected.has(slug)) {
            const svcInfo = SERVICE_MAP.get(slug);
            const combinedText = `${subject}\n${snippet}`;
            const amountInfo = extractAmount(combinedText);
            const chargeDate = date ? parseEmailDate(date) : null;
            const billingCycle = detectBillingCycle(
              combinedText,
              normaliseBillingCycle(svcInfo?.defaultCycle)
            );
            const nextRenewalDate = resolveRenewalDate(
              extractRenewalDate(combinedText),
              billingCycle,
              chargeDate
            );

            detected.set(slug, {
              serviceName: svcInfo?.name ?? slug,
              serviceSlug: slug,
              amount: amountInfo?.amount ?? svcInfo?.defaultAmount ?? null,
              currency: amountInfo?.currency ?? svcInfo?.defaultCurrency ?? "INR",
              billingCycle,
              startDate: toDateInput(chargeDate),
              nextRenewalDate: toDateInput(nextRenewalDate),
              emailSubject: subject,
              emailDate: chargeDate ? chargeDate.toISOString() : date || null,
            });
          }
        }

        scanned += batch.length;
        setState((s) => ({
          ...s,
          emailsScanned: scanned,
          subscriptionsFound: detected.size,
          foundServices: Array.from(detected.values()),
          progress: `Analyzed ${scanned}/${messageIds.length} emails — found ${detected.size} subscriptions`,
        }));
      }

      setState((s) => ({
        ...s,
        status: "done",
        phase: "done",
        progress: "Scan complete!",
        emailsScanned: scanned,
        subscriptionsFound: detected.size,
        foundServices: Array.from(detected.values()),
      }));

      qc.invalidateQueries({ queryKey: ["subscriptions"] });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Scan failed";
      setState({ ...initialState, status: "error", error: message });
    }
  }, [qc]);

  const reset = useCallback(() => {
    abortRef.current = true;
    setState(initialState);
  }, []);

  return { ...state, startScan, reset };
}
