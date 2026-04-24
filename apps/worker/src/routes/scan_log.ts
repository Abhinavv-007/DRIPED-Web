import { Hono } from 'hono';
import type { Env } from '../types';
import { VALID_SCAN_TYPES } from '../types';

const scanLog = new Hono<{
  Bindings: Env;
  Variables: { user: { uid: string; email: string } };
}>();

// POST /scan/log
scanLog.post('/log', async (c) => {
  const { uid } = c.get('user');
  const body = await c.req.json<{
    scan_type: string;
    emails_scanned: number;
    subscriptions_found: number;
  }>();

  if (!body.scan_type) {
    return c.json({ success: false, error: 'scan_type is required' }, 400);
  }

  if (!VALID_SCAN_TYPES.includes(body.scan_type as typeof VALID_SCAN_TYPES[number])) {
    return c.json({
      success: false,
      error: `Invalid scan_type. Must be: ${VALID_SCAN_TYPES.join(', ')}`,
    }, 400);
  }

  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    `INSERT INTO scan_log (id, user_id, scan_type, emails_scanned, subscriptions_found)
     VALUES (?, ?, ?, ?, ?)`,
  ).bind(
    id,
    uid,
    body.scan_type,
    body.emails_scanned || 0,
    body.subscriptions_found || 0,
  ).run();

  const row = await c.env.DB.prepare(
    'SELECT * FROM scan_log WHERE id = ?',
  ).bind(id).first();

  return c.json({ success: true, data: row }, 201);
});

export default scanLog;
