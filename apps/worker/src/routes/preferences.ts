import { Hono } from 'hono';
import type { Env, UserPreferencesRow } from '../types';

const preferences = new Hono<{
  Bindings: Env;
  Variables: { user: { uid: string; email: string } };
}>();

const DEFAULTS: Omit<UserPreferencesRow, 'user_id' | 'updated_at'> = {
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
};

const BOOLEAN_FIELDS = [
  'notify_renewal_7d', 'notify_renewal_3d', 'notify_renewal_1d',
  'notify_trial_end', 'notify_price_change', 'notify_monthly_summary',
  'auto_add_high_confidence',
] as const;

// GET /preferences \u2014 returns row or defaults
preferences.get('/', async (c) => {
  const { uid } = c.get('user');
  const row = await c.env.DB
    .prepare('SELECT * FROM user_preferences WHERE user_id = ?')
    .bind(uid)
    .first<UserPreferencesRow>();

  if (row) return c.json({ success: true, data: row });

  return c.json({
    success: true,
    data: { user_id: uid, ...DEFAULTS, updated_at: new Date().toISOString() },
  });
});

// PUT /preferences \u2014 upsert
preferences.put('/', async (c) => {
  const { uid } = c.get('user');
  const body = await c.req.json<Partial<UserPreferencesRow>>();
  const now = new Date().toISOString();

  const existing = await c.env.DB
    .prepare('SELECT user_id FROM user_preferences WHERE user_id = ?')
    .bind(uid)
    .first();

  const merged = { ...DEFAULTS, ...body };
  // Normalise booleans
  for (const k of BOOLEAN_FIELDS) {
    const v = (body as Record<string, unknown>)[k];
    if (typeof v === 'boolean') merged[k] = v ? 1 : 0;
  }

  if (existing) {
    await c.env.DB.prepare(
      `UPDATE user_preferences SET
         theme = ?, notify_renewal_7d = ?, notify_renewal_3d = ?, notify_renewal_1d = ?,
         notify_trial_end = ?, notify_price_change = ?, notify_monthly_summary = ?,
         auto_add_high_confidence = ?, quiet_hours_start = ?, quiet_hours_end = ?,
         updated_at = ?
       WHERE user_id = ?`,
    ).bind(
      merged.theme, merged.notify_renewal_7d, merged.notify_renewal_3d, merged.notify_renewal_1d,
      merged.notify_trial_end, merged.notify_price_change, merged.notify_monthly_summary,
      merged.auto_add_high_confidence, merged.quiet_hours_start, merged.quiet_hours_end,
      now, uid,
    ).run();
  } else {
    await c.env.DB.prepare(
      `INSERT INTO user_preferences
       (user_id, theme, notify_renewal_7d, notify_renewal_3d, notify_renewal_1d,
        notify_trial_end, notify_price_change, notify_monthly_summary,
        auto_add_high_confidence, quiet_hours_start, quiet_hours_end, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      uid, merged.theme, merged.notify_renewal_7d, merged.notify_renewal_3d, merged.notify_renewal_1d,
      merged.notify_trial_end, merged.notify_price_change, merged.notify_monthly_summary,
      merged.auto_add_high_confidence, merged.quiet_hours_start, merged.quiet_hours_end, now,
    ).run();
  }

  return c.json({ success: true, data: { user_id: uid, ...merged, updated_at: now } });
});

export default preferences;
