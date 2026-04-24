import { Hono } from 'hono';
import type { Env, SubscriptionRow, WhatIfBody } from '../types';

const insights = new Hono<{
  Bindings: Env;
  Variables: { user: { uid: string; email: string } };
}>();

// ─── Helpers ───
function monthlyEquivalent(amount: number, cycle: string): number {
  switch (cycle) {
    case 'weekly':    return amount * 4.345;
    case 'monthly':   return amount;
    case 'quarterly': return amount / 3;
    case 'yearly':    return amount / 12;
    case 'lifetime':  return 0;
    default:          return amount;
  }
}

function yearlyEquivalent(amount: number, cycle: string): number {
  return monthlyEquivalent(amount, cycle) * 12;
}

function isOlderThanDays(iso: string | null, days: number): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  if (!t) return false;
  return (Date.now() - t) / 86_400_000 > days;
}

// ─── GET /insights/savings ───
// Returns cancel suggestions, ghost subs, duplicates, annual-vs-monthly tips.
insights.get('/savings', async (c) => {
  const { uid } = c.get('user');
  const rows = await c.env.DB
    .prepare(`SELECT * FROM subscriptions WHERE user_id = ? AND status IN ('active', 'trial')`)
    .bind(uid)
    .all<SubscriptionRow>();
  const subs = rows.results ?? [];

  // Ghost: active sub that WAS originally detected from email scanning but has
  // had no fresh email activity for 60+ days. We restrict to email-sourced subs
  // so manually-added services never get flagged (they don't send receipts).
  const ghosts = subs.filter((s) => {
    if (s.status !== 'active') return false;
    const isEmailSourced =
      s.source === 'email_scan' ||
      s.source === 'email_auto' ||
      s.source === 'gmail_import';
    if (!isEmailSourced) return false;
    if (!s.last_email_detected_at) return false;
    return isOlderThanDays(s.last_email_detected_at, 60);
  });

  // Duplicate plans: same service_slug >1
  const slugCounts = new Map<string, SubscriptionRow[]>();
  for (const s of subs) {
    const arr = slugCounts.get(s.service_slug) ?? [];
    arr.push(s);
    slugCounts.set(s.service_slug, arr);
  }
  const duplicates: Array<{ slug: string; entries: SubscriptionRow[] }> = [];
  for (const [slug, entries] of slugCounts) {
    if (entries.length > 1) duplicates.push({ slug, entries });
  }

  // Annual-vs-monthly hint: monthly-billed subs that likely have annual plans
  // (use amount * 12 * 0.8 as rough savings hint).
  const annualHints = subs
    .filter((s) => s.billing_cycle === 'monthly' && s.amount > 0)
    .map((s) => ({
      subscription_id: s.id,
      service_name: s.service_name,
      service_slug: s.service_slug,
      monthly_amount: s.amount,
      hypothetical_yearly: s.amount * 12 * 0.83,  // 17% typical annual discount
      estimated_savings: s.amount * 12 * 0.17,
      currency: s.currency,
    }));

  // Top cancel candidates: ghosts first, then highest-cost duplicates
  const cancelCandidates = [
    ...ghosts.map((s) => ({
      subscription_id: s.id,
      service_name: s.service_name,
      service_slug: s.service_slug,
      reason: 'ghost' as const,
      yearly_saving: yearlyEquivalent(s.amount, s.billing_cycle),
      currency: s.currency,
    })),
    ...duplicates.flatMap(({ entries }) =>
      entries.slice(1).map((s) => ({  // keep one of each duplicate pair
        subscription_id: s.id,
        service_name: s.service_name,
        service_slug: s.service_slug,
        reason: 'duplicate' as const,
        yearly_saving: yearlyEquivalent(s.amount, s.billing_cycle),
        currency: s.currency,
      })),
    ),
  ];

  // Sort by largest savings
  cancelCandidates.sort((a, b) => b.yearly_saving - a.yearly_saving);

  // Totals
  const totalMonthly = subs.reduce((sum, s) => sum + monthlyEquivalent(s.amount, s.billing_cycle), 0);
  const totalYearly = totalMonthly * 12;
  const potentialYearlySavings = cancelCandidates.reduce((s, c) => s + c.yearly_saving, 0);

  return c.json({
    success: true,
    data: {
      totals: {
        active_count: subs.length,
        monthly: totalMonthly,
        yearly: totalYearly,
        potential_yearly_savings: potentialYearlySavings,
      },
      ghosts: ghosts.map((s) => ({
        subscription_id: s.id,
        service_name: s.service_name,
        service_slug: s.service_slug,
        amount: s.amount,
        currency: s.currency,
        billing_cycle: s.billing_cycle,
        last_email_detected_at: s.last_email_detected_at,
      })),
      duplicates,
      annual_hints: annualHints.slice(0, 5),
      cancel_candidates: cancelCandidates.slice(0, 10),
    },
  });
});

// ─── GET /insights/forecast?months=12 ───
insights.get('/forecast', async (c) => {
  const { uid } = c.get('user');
  const months = Math.min(24, Math.max(1, parseInt(c.req.query('months') ?? '12', 10)));

  const rows = await c.env.DB
    .prepare(`SELECT * FROM subscriptions WHERE user_id = ? AND status IN ('active', 'trial')`)
    .bind(uid)
    .all<SubscriptionRow>();
  const subs = rows.results ?? [];

  const now = new Date();
  const buckets: Array<{ month: string; total: number; charges: Array<{ sub_id: string; name: string; amount: number }> }> = [];

  for (let m = 0; m < months; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() + m, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets.push({ month: key, total: 0, charges: [] });
  }

  for (const s of subs) {
    // Project occurrences of this sub into the window
    const cycle = s.billing_cycle;
    if (cycle === 'lifetime') continue;
    const monthsPerCycle = {
      weekly: 0.25, monthly: 1, quarterly: 3, yearly: 12,
    }[cycle as 'weekly' | 'monthly' | 'quarterly' | 'yearly'] ?? 1;

    const anchor = s.next_renewal_date ? new Date(s.next_renewal_date) : now;
    let cursor = new Date(anchor);
    const end = new Date(now.getFullYear(), now.getMonth() + months, 1);

    // Walk back first if anchor is in future by more than one cycle (safe loop guard)
    let guard = 0;
    while (cursor >= end && guard < 120) {
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() - monthsPerCycle, cursor.getDate());
      guard++;
    }
    while (cursor < now && guard < 240) {
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + monthsPerCycle, cursor.getDate());
      guard++;
    }

    while (cursor < end && guard < 360) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      const bucket = buckets.find((b) => b.month === key);
      if (bucket) {
        bucket.total += s.amount;
        bucket.charges.push({ sub_id: s.id, name: s.service_name, amount: s.amount });
      }
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + monthsPerCycle, cursor.getDate());
      guard++;
    }
  }

  return c.json({ success: true, data: { months: buckets } });
});

// ─── GET /insights/calendar?days=90 ───
// Flat list of all renewal charges in the next N days (for heatmap).
insights.get('/calendar', async (c) => {
  const { uid } = c.get('user');
  const days = Math.min(365, Math.max(7, parseInt(c.req.query('days') ?? '90', 10)));

  const rows = await c.env.DB
    .prepare(`SELECT * FROM subscriptions WHERE user_id = ? AND status IN ('active', 'trial')`)
    .bind(uid)
    .all<SubscriptionRow>();
  const subs = rows.results ?? [];

  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
  const charges: Array<{ date: string; sub_id: string; name: string; amount: number; currency: string }> = [];

  for (const s of subs) {
    const cycle = s.billing_cycle;
    if (cycle === 'lifetime') continue;

    const anchor = s.next_renewal_date ? new Date(s.next_renewal_date) : null;
    if (!anchor) continue;

    const monthsPerCycle = {
      weekly: 0.25, monthly: 1, quarterly: 3, yearly: 12,
    }[cycle as 'weekly' | 'monthly' | 'quarterly' | 'yearly'] ?? 1;

    let cursor = new Date(anchor);
    let guard = 0;
    while (cursor < now && guard < 120) {
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + monthsPerCycle, cursor.getDate());
      guard++;
    }
    while (cursor <= end && guard < 120) {
      const iso = cursor.toISOString().slice(0, 10);
      charges.push({
        date: iso,
        sub_id: s.id,
        name: s.service_name,
        amount: s.amount,
        currency: s.currency,
      });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + monthsPerCycle, cursor.getDate());
      guard++;
    }
  }

  return c.json({ success: true, data: { charges } });
});

// ─── POST /insights/what-if ───
insights.post('/what-if', async (c) => {
  const { uid } = c.get('user');
  const body = await c.req.json<WhatIfBody>();
  const cancelIds = new Set(body.cancel_subscription_ids ?? []);

  const rows = await c.env.DB
    .prepare(`SELECT * FROM subscriptions WHERE user_id = ? AND status IN ('active', 'trial')`)
    .bind(uid)
    .all<SubscriptionRow>();
  const subs = rows.results ?? [];

  const baseline = subs.reduce(
    (acc, s) => ({
      monthly: acc.monthly + monthlyEquivalent(s.amount, s.billing_cycle),
      yearly: acc.yearly + yearlyEquivalent(s.amount, s.billing_cycle),
    }),
    { monthly: 0, yearly: 0 },
  );

  const remaining = subs.filter((s) => !cancelIds.has(s.id));
  const projected = remaining.reduce(
    (acc, s) => ({
      monthly: acc.monthly + monthlyEquivalent(s.amount, s.billing_cycle),
      yearly: acc.yearly + yearlyEquivalent(s.amount, s.billing_cycle),
    }),
    { monthly: 0, yearly: 0 },
  );

  return c.json({
    success: true,
    data: {
      baseline,
      projected,
      saving: {
        monthly: baseline.monthly - projected.monthly,
        yearly: baseline.yearly - projected.yearly,
      },
      cancelled_count: cancelIds.size,
    },
  });
});

export default insights;
