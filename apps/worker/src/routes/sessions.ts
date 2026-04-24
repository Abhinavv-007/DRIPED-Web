import { Hono } from 'hono';
import type { Env, DeviceSessionRow } from '../types';
import { VALID_PLATFORMS } from '../types';

const sessions = new Hono<{
  Bindings: Env;
  Variables: { user: { uid: string; email: string } };
}>();

// POST /sessions/ping \u2014 heartbeat from device; upserts last_sync_at
sessions.post('/ping', async (c) => {
  const { uid } = c.get('user');
  const body = await c.req.json<{
    device_id: string;
    platform: typeof VALID_PLATFORMS[number];
    device_label?: string;
  }>();

  if (!body.device_id || !body.platform) {
    return c.json({ success: false, error: 'device_id + platform required' }, 400);
  }
  if (!VALID_PLATFORMS.includes(body.platform)) {
    return c.json({ success: false, error: 'Invalid platform' }, 400);
  }

  const now = new Date().toISOString();
  const existing = await c.env.DB
    .prepare('SELECT id FROM device_sessions WHERE user_id = ? AND device_id = ?')
    .bind(uid, body.device_id)
    .first<{ id: string }>();

  if (existing) {
    await c.env.DB.prepare(
      'UPDATE device_sessions SET platform = ?, device_label = ?, last_sync_at = ? WHERE id = ?',
    ).bind(body.platform, body.device_label ?? null, now, existing.id).run();
    return c.json({ success: true, data: { id: existing.id, last_sync_at: now } });
  }

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO device_sessions (id, user_id, device_id, platform, device_label, last_sync_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).bind(id, uid, body.device_id, body.platform, body.device_label ?? null, now).run();

  return c.json({ success: true, data: { id, last_sync_at: now } }, 201);
});

// GET /sessions \u2014 list all user devices
sessions.get('/', async (c) => {
  const { uid } = c.get('user');
  const rows = await c.env.DB
    .prepare('SELECT * FROM device_sessions WHERE user_id = ? ORDER BY last_sync_at DESC')
    .bind(uid)
    .all<DeviceSessionRow>();
  return c.json({ success: true, data: rows.results ?? [] });
});

export default sessions;
