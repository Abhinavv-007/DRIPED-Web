"use client";

import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGmailAccessToken } from "@/lib/firebase";
import { api } from "@/lib/api/client";
import { SERVICE_MAP, normalizeServiceSlug } from "@/lib/constants/services";
import type { BillingCycle } from "@/lib/models/types";
import {
  extractFromEmail,
  mergeAiResult,
  type ParsedEmail,
} from "@/lib/scan";

const GMAIL_API = "https://www.googleapis.com/gmail/v1/users/me";

const SCAN_QUERIES = [
  '(receipt OR invoice OR "payment confirmation" OR "payment receipt" OR "tax invoice" OR billing OR charged OR paid)',
  '(subscription OR membership OR recurring OR "auto-renew") (receipt OR invoice OR billing OR payment)',
  '("renews on" OR "renewal date" OR "next billing" OR "next payment" OR "next charge")',
  '(from:googleplay-noreply@google.com OR from:payments-noreply@google.com OR from:no_reply@email.apple.com) (subscription OR receipt)',
];

const FALLBACK_CONFIDENCE_THRESHOLD = 70; // below = ask Worker AI
const ACCEPT_CONFIDENCE_THRESHOLD = 50;   // below = drop entirely

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

// ─────────────────────────────────────────────────────────────────────────────
// Gmail body decode (base64url, walk multipart, prefer text/html)
// ─────────────────────────────────────────────────────────────────────────────

interface GmailHeader { name?: string; value?: string }
interface GmailBody { data?: string; size?: number }
interface GmailPart {
  partId?: string;
  mimeType?: string;
  body?: GmailBody;
  parts?: GmailPart[];
  headers?: GmailHeader[];
}

function base64UrlDecodeUtf8(b64url: string): string {
  try {
    const normalized = b64url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const binStr = atob(padded);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch {
    return "";
  }
}

/**
 * Walk the MIME tree, prefer text/html when available (richer signals like
 * tables, anchors), fall back to text/plain. Strips ZWS and normalises CRLF.
 */
function decodeMessageBody(payload: GmailPart | undefined): string {
  if (!payload) return "";
  const html: string[] = [];
  const plain: string[] = [];

  const walk = (part: GmailPart) => {
    const mime = (part.mimeType ?? "").toLowerCase();
    const data = part.body?.data;
    if (data) {
      const decoded = base64UrlDecodeUtf8(data);
      if (mime.includes("html")) html.push(decoded);
      else if (mime.includes("text")) plain.push(decoded);
      else if (decoded) plain.push(decoded);
    }
    if (part.parts) part.parts.forEach(walk);
  };
  walk(payload);

  const raw = (html.length ? html.join("\n") : plain.join("\n")) ?? "";
  return raw
    .replace(/\u200B|\u200C|\u200D|\uFEFF/g, "")
    .replace(/\r\n?/g, "\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// ParsedEmail → DetectedSub mapping
// ─────────────────────────────────────────────────────────────────────────────

function toDetectedSub(
  parsed: ParsedEmail,
  subject: string,
  emailDateIso: string | null,
): DetectedSub | null {
  if (parsed.overallConfidence < ACCEPT_CONFIDENCE_THRESHOLD) return null;
  if (
    parsed.receiptType === "refund" ||
    parsed.receiptType === "failed" ||
    parsed.receiptType === "canceled"
  ) {
    return null;
  }
  if (!parsed.merchant) return null;

  const slug = normalizeServiceSlug(parsed.merchant.slug);
  const svcInfo = SERVICE_MAP.get(slug);

  return {
    serviceName: parsed.merchant.name || svcInfo?.name || slug,
    serviceSlug: slug,
    amount: parsed.amount?.amount ?? svcInfo?.defaultAmount ?? null,
    currency: parsed.amount?.currency ?? svcInfo?.defaultCurrency ?? "INR",
    billingCycle: (parsed.cycle ?? svcInfo?.defaultCycle ?? "monthly") as BillingCycle,
    startDate: parsed.chargedAt?.iso ?? null,
    nextRenewalDate: parsed.renewalDate?.iso ?? null,
    emailSubject: subject,
    emailDate: emailDateIso,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Worker AI fallback for low-confidence emails
// ─────────────────────────────────────────────────────────────────────────────

interface ExtractedSubscription {
  merchant_name: string | null;
  merchant_slug: string | null;
  amount: number | null;
  currency: string | null;
  billing_cycle: string | null;
  next_renewal_date: string | null;
  charged_at: string | null;
  receipt_type: string;
  confidence: number;
  reasons: string[];
}

async function workerAiFallback(
  parsed: ParsedEmail,
  emailBody: string,
  subject: string,
  from: string,
): Promise<ParsedEmail> {
  try {
    const res = await api.post<ExtractedSubscription>("/scan/extract", {
      email_body: emailBody.slice(0, 8000),
      email_subject: subject,
      email_from: from,
      email_hash: parsed.emailHash,
      hint_merchant: parsed.merchant?.slug ?? undefined,
    });
    if (!res.success || !res.data) return parsed;
    return mergeAiResult(parsed, res.data);
  } catch {
    return parsed;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

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

      // ─── Phase 1: collect message IDs from all queries ────────────────────
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

      // ─── Phase 2: fetch FULL bodies + run shared pipeline + AI fallback ───
      setState((s) => ({ ...s, progress: `Analyzing ${messageIds.length} emails...`, phase: "analyzing" }));
      const detected = new Map<string, DetectedSub>();
      let scanned = 0;
      const batchSize = 6; // smaller because full bodies are bigger

      for (let i = 0; i < messageIds.length; i += batchSize) {
        if (abortRef.current) break;
        const batch = messageIds.slice(i, i + batchSize);

        const results = await Promise.allSettled(
          batch.map(async (id) => {
            // Use format=full so we get headers + body. Massive recall win
            // versus the previous metadata-only call.
            const url = `${GMAIL_API}/messages/${id}?format=full`;
            const res = await fetch(url, { headers });
            if (!res.ok) return null;
            return res.json();
          }),
        );

        for (const result of results) {
          if (result.status !== "fulfilled" || !result.value) continue;
          const msg = result.value as { payload?: GmailPart; snippet?: string };
          const payload = msg.payload;
          const hdrs = payload?.headers ?? [];
          let from = "";
          let subject = "";
          let dateRaw = "";
          for (const h of hdrs) {
            if (h.name === "From") from = h.value ?? "";
            else if (h.name === "Subject") subject = h.value ?? "";
            else if (h.name === "Date") dateRaw = h.value ?? "";
          }

          const body = decodeMessageBody(payload) || msg.snippet || "";
          const headerMap: Record<string, string> = {};
          for (const h of hdrs) {
            if (h.name && h.value) headerMap[h.name.toLowerCase()] = h.value;
          }

          // 1) Local deterministic pipeline (regex + merchant table)
          let parsed = await extractFromEmail(
            { subject, from, body, dateIso: dateRaw || null, headers: headerMap },
            { preferCurrency: "INR" },
          );

          // 2) Cloud AI fallback for low-confidence emails (Worker /scan/extract)
          if (
            parsed.overallConfidence < FALLBACK_CONFIDENCE_THRESHOLD &&
            parsed.receiptType !== "refund" &&
            parsed.receiptType !== "failed" &&
            parsed.receiptType !== "canceled"
          ) {
            parsed = await workerAiFallback(parsed, body, subject, from);
          }

          const emailDateIso = (() => {
            if (!dateRaw) return null;
            const d = new Date(dateRaw);
            return Number.isNaN(d.getTime()) ? null : d.toISOString();
          })();

          const detection = toDetectedSub(parsed, subject, emailDateIso);
          if (!detection) continue;

          // Dedup by slug — first hit per slug wins (Gmail returns most-recent first)
          if (!detected.has(detection.serviceSlug)) {
            detected.set(detection.serviceSlug, detection);
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
