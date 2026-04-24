import { Hono } from 'hono';
import type { Env, PushSubscribeBody } from '../types';
import { VALID_PLATFORMS } from '../types';

const push = new Hono<{
  Bindings: Env;
  Variables: { user: { uid: string; email: string } };
}>();

// POST /push/subscribe \u2014 register a web-push or FCM endpoint
push.post('/subscribe', async (c) => {
  const { uid } = c.get('user');
  const body = await c.req.json<PushSubscribeBody>();

  if (!body.platform || !body.endpoint) {
    return c.json({ success: false, error: 'platform + endpoint required' }, 400);
  }
  if (!VALID_PLATFORMS.includes(body.platform)) {
    return c.json({ success: false, error: 'Invalid platform' }, 400);
  }
  if (body.platform === 'web' && (!body.p256dh || !body.auth_secret)) {
    return c.json({ success: false, error: 'p256dh + auth_secret required for web' }, 400);
  }

  // Upsert: one endpoint = one subscription
  const existing = await c.env.DB
    .prepare('SELECT id FROM push_subscriptions WHERE endpoint = ?')
    .bind(body.endpoint)
    .first();

  if (existing) {
    await c.env.DB.prepare(
      `UPDATE push_subscriptions
       SET user_id = ?, platform = ?, p256dh = ?, auth_secret = ?,
           device_label = ?, last_seen_at = datetime('now')
       WHERE endpoint = ?`,
    ).bind(
      uid, body.platform, body.p256dh ?? null, body.auth_secret ?? null,
      body.device_label ?? null, body.endpoint,
    ).run();
    return c.json({ success: true, data: { id: existing.id } });
  }

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO push_subscriptions
     (id, user_id, platform, endpoint, p256dh, auth_secret, device_label)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    id, uid, body.platform, body.endpoint,
    body.p256dh ?? null, body.auth_secret ?? null,
    body.device_label ?? null,
  ).run();

  return c.json({ success: true, data: { id } }, 201);
});

// DELETE /push/subscribe \u2014 remove by endpoint (query param)
push.delete('/subscribe', async (c) => {
  const { uid } = c.get('user');
  const endpoint = c.req.query('endpoint');
  if (!endpoint) {
    return c.json({ success: false, error: 'endpoint query param required' }, 400);
  }

  await c.env.DB
    .prepare('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?')
    .bind(uid, endpoint)
    .run();

  return c.json({ success: true });
});

// GET /push/subscriptions \u2014 list own endpoints (for settings screen)
push.get('/subscriptions', async (c) => {
  const { uid } = c.get('user');
  const rows = await c.env.DB
    .prepare(`SELECT id, platform, device_label, last_seen_at, created_at
              FROM push_subscriptions WHERE user_id = ?
              ORDER BY last_seen_at DESC`)
    .bind(uid)
    .all();
  return c.json({ success: true, data: rows.results ?? [] });
});

// GET /push/vapid-public-key \u2014 public, so clients can subscribe
push.get('/vapid-public-key', (c) => {
  return c.json({ success: true, data: { key: c.env.VAPID_PUBLIC_KEY } });
});

export default push;
