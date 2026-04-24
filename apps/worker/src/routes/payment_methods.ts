import { Hono } from 'hono';
import type { Env } from '../types';
import { VALID_PM_TYPES } from '../types';

const paymentMethods = new Hono<{
  Bindings: Env;
  Variables: { user: { uid: string; email: string } };
}>();

const DEFAULT_ICON_SLUGS: Record<string, string> = {
  credit_card: 'creditcard',
  debit_card: 'debitcard',
  visa: 'visa',
  mastercard: 'mastercard',
  american_express: 'americanexpress',
  amex: 'americanexpress',
  rupay: 'rupay',
  diners_club: 'dinersclub',
  discover: 'discover',
  maestro: 'maestro',
  upi: 'upi',
  gpay: 'googlepay',
  phonepe: 'phonepe',
  paytm: 'paytm',
  net_banking: 'banktransfer',
  bank_transfer: 'banktransfer',
  paypal: 'paypal',
  apple_pay: 'applepay',
  amazon_pay: 'amazonpay',
  samsung_pay: 'samsungpay',
  wallet: 'wallet',
  crypto: 'btc',
  bitcoin: 'btc',
  binance: 'binance',
};

// GET /payment-methods
paymentMethods.get('/', async (c) => {
  const { uid } = c.get('user');

  const result = await c.env.DB.prepare(
    'SELECT * FROM payment_methods WHERE user_id = ? ORDER BY is_default DESC, created_at ASC',
  ).bind(uid).all();

  return c.json({ success: true, data: result.results || [] });
});

// POST /payment-methods
paymentMethods.post('/', async (c) => {
  const { uid, email } = c.get('user');
  const body = await c.req.json<Record<string, unknown>>();

  if (!body.name || !body.type) {
    return c.json({ success: false, error: 'name and type are required' }, 400);
  }

  const pmType = body.type as string;
  if (!VALID_PM_TYPES.includes(pmType as typeof VALID_PM_TYPES[number])) {
    return c.json({
      success: false,
      error: `Invalid type. Must be: ${VALID_PM_TYPES.join(', ')}`,
    }, 400);
  }

  const id = crypto.randomUUID();
  const isDefault = body.is_default ? 1 : 0;

  await c.env.DB.prepare(
    `INSERT INTO users (id, email)
     SELECT ?, ?
     WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = ?)`,
  ).bind(uid, email, uid).run();

  // If setting as default, clear other defaults first
  if (isDefault) {
    await c.env.DB.prepare(
      'UPDATE payment_methods SET is_default = 0 WHERE user_id = ?',
    ).bind(uid).run();
  }

  await c.env.DB.prepare(
    `INSERT INTO payment_methods
     (id, user_id, name, type, icon_slug, last_four, expiry_month, expiry_year, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    id, uid,
    body.name as string,
    pmType,
    (body.icon_slug as string) || DEFAULT_ICON_SLUGS[pmType] || null,
    (body.last_four as string) || null,
    (body.expiry_month as number) ?? null,
    (body.expiry_year as number) ?? null,
    isDefault,
  ).run();

  const row = await c.env.DB.prepare(
    'SELECT * FROM payment_methods WHERE id = ?',
  ).bind(id).first();

  return c.json({ success: true, data: row }, 201);
});

// PUT /payment-methods/:id
paymentMethods.put('/:id', async (c) => {
  const { uid } = c.get('user');
  const pmId = c.req.param('id');

  const existing = await c.env.DB.prepare(
    'SELECT * FROM payment_methods WHERE id = ? AND user_id = ?',
  ).bind(pmId, uid).first();

  if (!existing) {
    return c.json({ success: false, error: 'Payment method not found' }, 404);
  }

  const body = await c.req.json<Record<string, unknown>>();

  if (body.type) {
    const pmType = body.type as string;
    if (!VALID_PM_TYPES.includes(pmType as typeof VALID_PM_TYPES[number])) {
      return c.json({ success: false, error: 'Invalid type' }, 400);
    }
  }

  // Handle default logic
  if (body.is_default) {
    await c.env.DB.prepare(
      'UPDATE payment_methods SET is_default = 0 WHERE user_id = ?',
    ).bind(uid).run();
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  const updatable = ['name', 'type', 'icon_slug', 'last_four', 'expiry_month', 'expiry_year'];
  for (const key of updatable) {
    if (key in body) {
      fields.push(`${key} = ?`);
      values.push(body[key] as unknown);
    }
  }

  if ('is_default' in body) {
    fields.push('is_default = ?');
    values.push(body.is_default ? 1 : 0);
  }

  if (fields.length === 0) {
    return c.json({ success: false, error: 'No fields to update' }, 400);
  }

  values.push(pmId, uid);
  await c.env.DB.prepare(
    `UPDATE payment_methods SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
  ).bind(...values).run();

  const updated = await c.env.DB.prepare(
    'SELECT * FROM payment_methods WHERE id = ?',
  ).bind(pmId).first();

  return c.json({ success: true, data: updated });
});

// DELETE /payment-methods/:id
paymentMethods.delete('/:id', async (c) => {
  const { uid } = c.get('user');
  const pmId = c.req.param('id');

  const existing = await c.env.DB.prepare(
    'SELECT id FROM payment_methods WHERE id = ? AND user_id = ?',
  ).bind(pmId, uid).first();

  if (!existing) {
    return c.json({ success: false, error: 'Payment method not found' }, 404);
  }

  // Check if any subscriptions reference this method
  const refs = await c.env.DB.prepare(
    'SELECT id, service_name FROM subscriptions WHERE payment_method_id = ? AND user_id = ?',
  ).bind(pmId, uid).all();

  const refRows = refs.results || [];
  if (refRows.length > 0) {
    const names = refRows.map((r: Record<string, unknown>) => r.service_name as string);
    return c.json({
      success: false,
      error: `Cannot delete: used by ${refRows.length} subscription(s)`,
      referenced_by: names,
    }, 409);
  }

  await c.env.DB.prepare(
    'DELETE FROM payment_methods WHERE id = ? AND user_id = ?',
  ).bind(pmId, uid).run();

  return c.json({ success: true });
});

export default paymentMethods;
