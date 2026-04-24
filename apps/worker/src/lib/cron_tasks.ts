import type { Env, SubscriptionRow, UserPreferencesRow } from '../types';
import { pushToUser } from './push_dispatch';

/// Walks every active subscription, determines which users need a renewal
/// ping today (7 / 3 / 1 day windows), and fans out Web Push + FCM.
export async function dispatchRenewalReminders(env: Env): Promise<void> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const iso = today.toISOString().slice(0, 10);

  // Targets: subs whose next_renewal_date is exactly today+1, today+3, today+7
  const targets: Array<{ row: SubscriptionRow; daysOut: 7 | 3 | 1 }> = [];
  for (const daysOut of [7, 3, 1] as const) {
    const target = new Date(today.getTime() + daysOut * 86_400_000);
    const targetIso = target.toISOString().slice(0, 10);
    const rows = await env.DB
      .prepare(`SELECT * FROM subscriptions
                WHERE status IN ('active', 'trial')
                AND next_renewal_date LIKE ?`)
      .bind(`${targetIso}%`)
      .all<SubscriptionRow>();
    for (const row of rows.results ?? []) {
      targets.push({ row, daysOut });
    }
  }

  // Group by user to respect per-user prefs + quiet hours
  const byUser = new Map<string, typeof targets>();
  for (const t of targets) {
    const list = byUser.get(t.row.user_id) ?? [];
    list.push(t);
    byUser.set(t.row.user_id, list);
  }

  for (const [userId, userTargets] of byUser) {
    const prefs = await getPrefs(env, userId);
    if (inQuietHours(prefs)) continue;

    for (const { row, daysOut } of userTargets) {
      if (daysOut === 7 && !prefs.notify_renewal_7d) continue;
      if (daysOut === 3 && !prefs.notify_renewal_3d) continue;
      if (daysOut === 1 && !prefs.notify_renewal_1d) continue;

      const title = renewalTitle(row.service_name, daysOut);
      const body = renewalBody(row, daysOut);

      await pushToUser(env, userId, {
        title,
        body,
        tag: `renewal:${row.id}:${daysOut}`,
        url: `/subscriptions/${row.id}`,
        data: { subscription_id: row.id, kind: 'renewal', days_out: daysOut },
      });
    }
  }

  // Also trials ending in <=3 days \u2014 separate pass
  const trialRows = await env.DB
    .prepare(`SELECT * FROM subscriptions
              WHERE status IN ('trial')
              AND trial_end_date IS NOT NULL
              AND date(trial_end_date) <= date(?, '+3 days')
              AND date(trial_end_date) >= date(?)`)
    .bind(iso, iso)
    .all<SubscriptionRow>();

  for (const row of trialRows.results ?? []) {
    const prefs = await getPrefs(env, row.user_id);
    if (!prefs.notify_trial_end) continue;
    if (inQuietHours(prefs)) continue;

    await pushToUser(env, row.user_id, {
      title: `${row.service_name} trial ends soon`,
      body: `Cancel before ${row.trial_end_date?.slice(0, 10)} to avoid a charge.`,
      tag: `trial:${row.id}`,
      url: `/subscriptions/${row.id}`,
      data: { subscription_id: row.id, kind: 'trial_end' },
    });
  }
}

/// Monthly summary \u2014 total spend + new subs since last month.
export async function dispatchMonthlySummary(env: Env): Promise<void> {
  const users = await env.DB
    .prepare('SELECT id FROM users')
    .all<{ id: string }>();

  for (const u of users.results ?? []) {
    const prefs = await getPrefs(env, u.id);
    if (!prefs.notify_monthly_summary) continue;

    const rows = await env.DB
      .prepare(`SELECT amount, billing_cycle, currency FROM subscriptions
                WHERE user_id = ? AND status IN ('active', 'trial')`)
      .bind(u.id)
      .all<{ amount: number; billing_cycle: string; currency: string }>();

    const monthly = (rows.results ?? []).reduce((sum, r) => {
      switch (r.billing_cycle) {
        case 'weekly':    return sum + r.amount * 4.345;
        case 'monthly':   return sum + r.amount;
        case 'quarterly': return sum + r.amount / 3;
        case 'yearly':    return sum + r.amount / 12;
        default:          return sum;
      }
    }, 0);

    await pushToUser(env, u.id, {
      title: 'Your monthly subscription snapshot',
      body: `You're spending ~${Math.round(monthly)} this month across ${rows.results?.length ?? 0} active subs.`,
      tag: 'monthly-summary',
      url: '/analytics',
      data: { kind: 'monthly_summary', monthly, count: rows.results?.length ?? 0 },
    });
  }
}

// ─── Helpers ───
async function getPrefs(env: Env, userId: string): Promise<UserPreferencesRow> {
  const row = await env.DB
    .prepare('SELECT * FROM user_preferences WHERE user_id = ?')
    .bind(userId)
    .first<UserPreferencesRow>();

  if (row) return row;

  // Defaults when no row exists yet
  return {
    user_id: userId,
    theme: 'dark',
    notify_renewal_7d: 1,
    notify_renewal_3d: 1,
    notify_renewal_1d: 1,
    notify_trial_end: 1,
    notify_price_change: 1,
    notify_monthly_summary: 1,
    auto_add_high_confidence: 0,
    quiet_hours_start: null,
    quiet_hours_end: null,
    updated_at: new Date().toISOString(),
  };
}

function inQuietHours(prefs: UserPreferencesRow): boolean {
  if (prefs.quiet_hours_start == null || prefs.quiet_hours_end == null) return false;
  const h = new Date().getUTCHours();
  const s = prefs.quiet_hours_start;
  const e = prefs.quiet_hours_end;
  if (s === e) return false;
  return s < e ? h >= s && h < e : h >= s || h < e;
}

function renewalTitle(name: string, days: 7 | 3 | 1): string {
  if (days === 1) return `${name} renews tomorrow`;
  if (days === 3) return `${name} renews in 3 days`;
  return `${name} renews next week`;
}

function renewalBody(row: SubscriptionRow, days: 7 | 3 | 1): string {
  const amt = `${row.currency} ${row.amount.toFixed(2)}`;
  if (days === 1) return `${amt} will be charged tomorrow. Tap to review.`;
  return `${amt} charges in ${days} days. Still using it?`;
}
