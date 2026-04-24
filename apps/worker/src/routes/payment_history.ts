import { Hono } from 'hono';
import type { Env } from '../types';

const paymentHistory = new Hono<{
  Bindings: Env;
  Variables: { user: { uid: string; email: string } };
}>();

// GET /payment-history
paymentHistory.get('/', async (c) => {
  const { uid } = c.get('user');
  const subscriptionId = c.req.query('subscription_id');
  const limit = parseInt(c.req.query('limit') || '100', 10);

  let query = `
    SELECT ph.*, s.service_name
    FROM payment_history ph
    LEFT JOIN subscriptions s ON ph.subscription_id = s.id
    WHERE ph.user_id = ?
  `;
  const params: unknown[] = [uid];

  if (subscriptionId) {
    query += ' AND ph.subscription_id = ?';
    params.push(subscriptionId);
  }

  query += ' ORDER BY ph.charged_at DESC LIMIT ?';
  params.push(limit);

  const result = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({ success: true, data: result.results || [] });
});

// POST /payment-history/bulk
paymentHistory.post('/bulk', async (c) => {
  const { uid } = c.get('user');
  const body = await c.req.json<{
    entries: Array<{
      subscription_id: string;
      amount: number;
      currency?: string;
      charged_at: string;
      email_subject?: string;
      payment_method_hint?: string;
    }>;
  }>();

  if (!body.entries || !Array.isArray(body.entries) || body.entries.length === 0) {
    return c.json({ success: false, error: 'entries array is required and must not be empty' }, 400);
  }

  // INSERT OR IGNORE deduplicates by (subscription_id + charged_at)
  // We use a unique combo check via the insert itself
  const stmt = c.env.DB.prepare(
    `INSERT OR IGNORE INTO payment_history
     (id, user_id, subscription_id, amount, currency, charged_at, email_subject, payment_method_hint)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const batch = body.entries.map((entry) =>
    stmt.bind(
      crypto.randomUUID(),
      uid,
      entry.subscription_id,
      entry.amount,
      entry.currency || 'INR',
      entry.charged_at,
      entry.email_subject || null,
      entry.payment_method_hint || null,
    ),
  );

  const results = await c.env.DB.batch(batch);

  // Count successful inserts
  let inserted = 0;
  for (const r of results) {
    if (r.meta?.changes) {
      inserted += r.meta.changes;
    }
  }

  return c.json({ success: true, inserted });
});

export default paymentHistory;
