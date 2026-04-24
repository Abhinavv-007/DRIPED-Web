import { Hono } from 'hono';
import type { Env } from '../types';
import { VALID_BILLING_CYCLES, VALID_STATUSES, VALID_SOURCES } from '../types';

const subscriptions = new Hono<{
  Bindings: Env;
  Variables: { user: { uid: string; email: string } };
}>();

// GET /subscriptions — list with optional status filter
subscriptions.get('/', async (c) => {
  const { uid } = c.get('user');
  const status = c.req.query('status');
  const limit = parseInt(c.req.query('limit') || '200', 10);

  let query = `
    SELECT s.*,
      json_object(
        'id', c.id, 'name', c.name, 'colour_hex', c.colour_hex,
        'icon_name', c.icon_name, 'budget_limit', c.budget_limit
      ) AS category,
      json_object(
        'id', pm.id, 'name', pm.name, 'type', pm.type,
        'icon_slug', pm.icon_slug, 'last_four', pm.last_four
      ) AS payment_method
    FROM subscriptions s
    LEFT JOIN categories c ON s.category_id = c.id
    LEFT JOIN payment_methods pm ON s.payment_method_id = pm.id
    WHERE s.user_id = ?
  `;
  const params: unknown[] = [uid];

  if (status) {
    query += ' AND s.status = ?';
    params.push(status);
  }

  query += ' ORDER BY s.next_renewal_date ASC LIMIT ?';
  params.push(limit);

  const stmt = c.env.DB.prepare(query);
  const result = await stmt.bind(...params).all();

  const rows = (result.results || []).map((row: Record<string, unknown>) => ({
    ...row,
    category: row.category ? JSON.parse(row.category as string) : null,
    payment_method: row.payment_method ? JSON.parse(row.payment_method as string) : null,
  }));

  return c.json({ success: true, data: rows });
});

// POST /subscriptions — create
subscriptions.post('/', async (c) => {
  const { uid, email } = c.get('user');
  const body = await c.req.json<Record<string, unknown>>();

  if (!body.service_name || !body.service_slug || body.amount == null || !body.billing_cycle) {
    return c.json({ success: false, error: 'service_name, service_slug, amount, billing_cycle required' }, 400);
  }

  const cycle = body.billing_cycle as string;
  if (!VALID_BILLING_CYCLES.includes(cycle as typeof VALID_BILLING_CYCLES[number])) {
    return c.json({ success: false, error: `Invalid billing_cycle. Must be: ${VALID_BILLING_CYCLES.join(', ')}` }, 400);
  }

  const status = (body.status as string) || 'active';
  if (!VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
    return c.json({ success: false, error: `Invalid status. Must be: ${VALID_STATUSES.join(', ')}` }, 400);
  }

  const source = (body.source as string) || 'manual';
  if (!VALID_SOURCES.includes(source as typeof VALID_SOURCES[number])) {
    return c.json({ success: false, error: `Invalid source. Must be: ${VALID_SOURCES.join(', ')}` }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `INSERT INTO users (id, email)
     SELECT ?, ?
     WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = ?)`,
  ).bind(uid, email, uid).run();

  await c.env.DB.prepare(
    `INSERT INTO subscriptions
     (id, user_id, service_name, service_slug, category_id, amount, currency,
      billing_cycle, start_date, next_renewal_date, trial_end_date, is_trial,
      status, payment_method_id, notes, source, last_email_detected_at,
      created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    id, uid,
    body.service_name as string,
    body.service_slug as string,
    (body.category_id as string) || null,
    body.amount as number,
    (body.currency as string) || 'INR',
    cycle,
    (body.start_date as string) || null,
    (body.next_renewal_date as string) || null,
    (body.trial_end_date as string) || null,
    body.is_trial ? 1 : 0,
    status,
    (body.payment_method_id as string) || null,
    (body.notes as string) || null,
    source,
    (body.last_email_detected_at as string) || null,
    now, now,
  ).run();

  const row = await c.env.DB.prepare(
    'SELECT * FROM subscriptions WHERE id = ?',
  ).bind(id).first();

  return c.json({ success: true, data: row }, 201);
});

// PUT /subscriptions/:id — update
subscriptions.put('/:id', async (c) => {
  const { uid } = c.get('user');
  const subId = c.req.param('id');

  // Verify ownership
  const existing = await c.env.DB.prepare(
    'SELECT * FROM subscriptions WHERE id = ? AND user_id = ?',
  ).bind(subId, uid).first();

  if (!existing) {
    return c.json({ success: false, error: 'Subscription not found' }, 404);
  }

  const body = await c.req.json<Record<string, unknown>>();

  if (body.billing_cycle) {
    const cycle = body.billing_cycle as string;
    if (!VALID_BILLING_CYCLES.includes(cycle as typeof VALID_BILLING_CYCLES[number])) {
      return c.json({ success: false, error: `Invalid billing_cycle` }, 400);
    }
  }
  if (body.status) {
    const st = body.status as string;
    if (!VALID_STATUSES.includes(st as typeof VALID_STATUSES[number])) {
      return c.json({ success: false, error: `Invalid status` }, 400);
    }
  }

  // Build dynamic update
  const fields: string[] = [];
  const values: unknown[] = [];

  const updatable = [
    'service_name', 'service_slug', 'category_id', 'amount', 'currency',
    'billing_cycle', 'start_date', 'next_renewal_date', 'trial_end_date',
    'is_trial', 'status', 'payment_method_id', 'notes', 'source',
    'last_email_detected_at',
  ];

  for (const key of updatable) {
    if (key in body) {
      if (key === 'is_trial') {
        fields.push(`${key} = ?`);
        values.push(body[key] ? 1 : 0);
      } else {
        fields.push(`${key} = ?`);
        values.push(body[key] as unknown);
      }
    }
  }

  if (fields.length === 0) {
    return c.json({ success: false, error: 'No fields to update' }, 400);
  }

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(subId, uid);

  await c.env.DB.prepare(
    `UPDATE subscriptions SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
  ).bind(...values).run();

  const updated = await c.env.DB.prepare(
    'SELECT * FROM subscriptions WHERE id = ?',
  ).bind(subId).first();

  return c.json({ success: true, data: updated });
});

// DELETE /subscriptions/:id
subscriptions.delete('/:id', async (c) => {
  const { uid } = c.get('user');
  const subId = c.req.param('id');

  const existing = await c.env.DB.prepare(
    'SELECT id FROM subscriptions WHERE id = ? AND user_id = ?',
  ).bind(subId, uid).first();

  if (!existing) {
    return c.json({ success: false, error: 'Subscription not found' }, 404);
  }

  // Delete related payment history first
  await c.env.DB.prepare(
    'DELETE FROM payment_history WHERE subscription_id = ? AND user_id = ?',
  ).bind(subId, uid).run();

  // Delete subscription
  await c.env.DB.prepare(
    'DELETE FROM subscriptions WHERE id = ? AND user_id = ?',
  ).bind(subId, uid).run();

  return c.json({ success: true });
});

export default subscriptions;
