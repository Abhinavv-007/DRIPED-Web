import type { Env, ExtractedSubscription } from '../types';
import { cacheKeyFor } from './hash';

/// Workers AI extraction using Llama 3.1 8B Instruct. Returns a structured
/// ExtractedSubscription with confidence 0-100. Cached in KV for 24h by
/// email-body hash.
///
/// Philosophy: be strict \u2014 if the model is uncertain, return low confidence
/// and let the UI prompt the user. Never hallucinate amounts or dates.

const MODEL = '@cf/meta/llama-3.1-8b-instruct';
const CACHE_TTL_SECONDS = 24 * 60 * 60;

const SYSTEM_PROMPT = `You extract subscription info from receipt emails. You MUST respond with a single JSON object matching this schema, and nothing else \u2014 no prose, no code fences.

{
  "merchant_name": string | null,
  "merchant_slug": string | null,
  "amount": number | null,
  "currency": string | null,
  "billing_cycle": "weekly" | "monthly" | "quarterly" | "yearly" | "lifetime" | null,
  "next_renewal_date": string | null,
  "charged_at": string | null,
  "receipt_type": "paid" | "upcoming" | "refund" | "failed" | "trial_started" | "trial_ending" | "canceled" | "unknown",
  "confidence": number,
  "reasons": string[]
}

Rules:
- Dates MUST be ISO 8601 YYYY-MM-DD.
- amount is the primary charge, a positive number. Use null if not certain.
- currency is ISO 4217 (INR, USD, EUR, GBP, \u2026). Use null if unclear.
- merchant_slug is lowercase snake_case (e.g., "netflix", "amazon_prime", "youtube_premium").
- If this is NOT a subscription-related email (e.g., marketing, OTP, personal), set receipt_type to "unknown" and confidence to 0.
- Confidence 0-100: 90+ = certain, 70-89 = likely, 40-69 = guess, <40 = uncertain.
- reasons: 1-4 short strings explaining what you matched on. Max 12 words each.`;

export async function extractSubscriptionFromEmail(
  env: Env,
  body: {
    email_body: string;
    email_subject?: string;
    email_from?: string;
    email_hash?: string;
    hint_merchant?: string;
  },
): Promise<ExtractedSubscription> {
  const cacheKey = body.email_hash ?? await cacheKeyFor([
    body.email_subject ?? '',
    body.email_from ?? '',
    body.email_body.slice(0, 2000),
  ]);
  const kvKey = `scan:extract:${cacheKey}`;

  const cached = await env.KV.get(kvKey, 'json');
  if (cached) return cached as ExtractedSubscription;

  // Trim large HTML to keep context window reasonable
  const clean = sanitizeBody(body.email_body);

  const user = [
    body.email_subject ? `Subject: ${body.email_subject}` : '',
    body.email_from ? `From: ${body.email_from}` : '',
    body.hint_merchant ? `Hint: merchant likely "${body.hint_merchant}"` : '',
    '---',
    clean,
  ].filter(Boolean).join('\n');

  try {
    // Workers AI types loose \u2014 cast through unknown
    const ai = env.AI as unknown as {
      run(model: string, input: Record<string, unknown>): Promise<{ response?: string }>;
    };

    const res = await ai.run(MODEL, {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: user },
      ],
      max_tokens: 512,
      temperature: 0.1,
    });

    const raw = (res?.response ?? '').trim();
    const parsed = safeParseJson(raw);
    if (!parsed) {
      const fallback = emptyResult('AI returned unparseable output');
      await env.KV.put(kvKey, JSON.stringify(fallback), { expirationTtl: CACHE_TTL_SECONDS });
      return fallback;
    }

    const normalised = normalise(parsed);
    await env.KV.put(kvKey, JSON.stringify(normalised), { expirationTtl: CACHE_TTL_SECONDS });
    return normalised;
  } catch (err) {
    const fallback = emptyResult(`AI error: ${(err as Error).message}`);
    // Short TTL for errors so transient issues retry on next call
    await env.KV.put(kvKey, JSON.stringify(fallback), { expirationTtl: 300 });
    return fallback;
  }
}

function sanitizeBody(body: string): string {
  // strip script + style blocks, collapse whitespace, cap length
  const noScripts = body
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const text = noScripts
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > 6000 ? text.slice(0, 6000) : text;
}

function safeParseJson(raw: string): Record<string, unknown> | null {
  if (!raw) return null;
  // LLMs sometimes wrap in ```json \u2026 ```
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  try {
    const obj = JSON.parse(stripped);
    return typeof obj === 'object' && obj ? obj as Record<string, unknown> : null;
  } catch {
    // Try to find the first {...} block
    const match = stripped.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

const VALID_CYCLES = ['weekly', 'monthly', 'quarterly', 'yearly', 'lifetime'] as const;
const VALID_TYPES = [
  'paid', 'upcoming', 'refund', 'failed',
  'trial_started', 'trial_ending', 'canceled', 'unknown',
] as const;

function normalise(obj: Record<string, unknown>): ExtractedSubscription {
  const merchantName = typeof obj.merchant_name === 'string' ? obj.merchant_name : null;
  let merchantSlug = typeof obj.merchant_slug === 'string' ? obj.merchant_slug : null;
  if (merchantSlug) {
    merchantSlug = merchantSlug.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
  }
  const amount = typeof obj.amount === 'number' && isFinite(obj.amount) && obj.amount > 0
    ? obj.amount : null;
  const currency = typeof obj.currency === 'string'
    ? obj.currency.toUpperCase().slice(0, 3) : null;
  const cycle = VALID_CYCLES.includes(obj.billing_cycle as typeof VALID_CYCLES[number])
    ? obj.billing_cycle as typeof VALID_CYCLES[number] : null;
  const receiptType = VALID_TYPES.includes(obj.receipt_type as typeof VALID_TYPES[number])
    ? obj.receipt_type as typeof VALID_TYPES[number] : 'unknown';
  const confidence = typeof obj.confidence === 'number'
    ? Math.max(0, Math.min(100, Math.round(obj.confidence))) : 0;
  const reasons = Array.isArray(obj.reasons)
    ? obj.reasons.filter((r): r is string => typeof r === 'string').slice(0, 4) : [];

  return {
    merchant_name: merchantName,
    merchant_slug: merchantSlug,
    amount,
    currency,
    billing_cycle: cycle,
    next_renewal_date: isoDate(obj.next_renewal_date),
    charged_at: isoDate(obj.charged_at),
    receipt_type: receiptType,
    confidence,
    reasons,
  };
}

function isoDate(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const match = v.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : null;
}

function emptyResult(reason: string): ExtractedSubscription {
  return {
    merchant_name: null,
    merchant_slug: null,
    amount: null,
    currency: null,
    billing_cycle: null,
    next_renewal_date: null,
    charged_at: null,
    receipt_type: 'unknown',
    confidence: 0,
    reasons: [reason],
  };
}
