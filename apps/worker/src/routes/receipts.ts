import { Hono } from 'hono';
import type { Env, ReceiptRefRow } from '../types';

const receipts = new Hono<{
  Bindings: Env;
  Variables: { user: { uid: string; email: string } };
}>();

// POST /receipts \u2014 store an email reference (receipt locker)
receipts.post('/', async (c) => {
  const { uid } = c.get('user');
  const body = await c.req.json<Partial<ReceiptRefRow>>();

  if (!body.email_hash) {
    return c.json({ success: false, error: 'email_hash required' }, 400);
  }

  // Dedup: skip if we've already stored this email for this user
  const existing = await c.env.DB
    .prepare('SELECT id FROM receipt_refs WHERE user_id = ? AND email_hash = ?')
    .bind(uid, body.email_hash)
    .first<{ id: string }>();

  if (existing) return c.json({ success: true, data: { id: existing.id, deduped: true } });

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO receipt_refs
     (id, user_id, subscription_id, email_hash, gmail_message_id,
      subject, sender, snippet, amount, currency, charged_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    id, uid, body.subscription_id ?? null, body.email_hash,
    body.gmail_message_id ?? null, body.subject ?? null, body.sender ?? null,
    body.snippet ?? null, body.amount ?? null, body.currency ?? null,
    body.charged_at ?? null,
  ).run();

  return c.json({ success: true, data: { id } }, 201);
});

// GET /receipts/:subscriptionId \u2014 receipts for a subscription
receipts.get('/:subscriptionId', async (c) => {
  const { uid } = c.get('user');
  const subId = c.req.param('subscriptionId');

  const rows = await c.env.DB
    .prepare(`SELECT * FROM receipt_refs
              WHERE user_id = ? AND subscription_id = ?
              ORDER BY charged_at DESC LIMIT 100`)
    .bind(uid, subId)
    .all<ReceiptRefRow>();

  return c.json({ success: true, data: rows.results ?? [] });
});

export default receipts;
