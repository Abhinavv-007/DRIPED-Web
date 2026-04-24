import { Hono } from 'hono';
import type { Env } from '../types';

const categories = new Hono<{
  Bindings: Env;
  Variables: { user: { uid: string; email: string } };
}>();

// Monthly multiplier for normalising amounts
const CYCLE_MONTHLY_FACTOR: Record<string, number> = {
  weekly: 4.333,
  monthly: 1,
  quarterly: 1 / 3,
  yearly: 1 / 12,
  lifetime: 0,
};

// GET /categories — with sub_count + monthly_spend aggregates
categories.get('/', async (c) => {
  const { uid } = c.get('user');

  // Get all categories
  const catsResult = await c.env.DB.prepare(
    'SELECT * FROM categories WHERE user_id = ? ORDER BY is_default DESC, name ASC',
  ).bind(uid).all();
  const cats = catsResult.results || [];

  // Get active subscriptions for aggregation
  const subsResult = await c.env.DB.prepare(
    `SELECT category_id, amount, billing_cycle
     FROM subscriptions
     WHERE user_id = ? AND status = 'active'`,
  ).bind(uid).all();
  const subs = subsResult.results || [];

  // Compute aggregates per category
  const countMap = new Map<string, number>();
  const spendMap = new Map<string, number>();

  for (const sub of subs) {
    const catId = sub.category_id as string | null;
    if (!catId) continue;

    countMap.set(catId, (countMap.get(catId) || 0) + 1);

    const amount = sub.amount as number;
    const cycle = sub.billing_cycle as string;
    const factor = CYCLE_MONTHLY_FACTOR[cycle] ?? 1;
    const monthly = amount * factor;
    spendMap.set(catId, (spendMap.get(catId) || 0) + monthly);
  }

  const data = cats.map((cat: Record<string, unknown>) => ({
    ...cat,
    sub_count: countMap.get(cat.id as string) || 0,
    monthly_spend: Math.round((spendMap.get(cat.id as string) || 0) * 100) / 100,
  }));

  return c.json({ success: true, data });
});

// PUT /categories/:id — update budget_limit or colour_hex only
categories.put('/:id', async (c) => {
  const { uid } = c.get('user');
  const catId = c.req.param('id');

  const existing = await c.env.DB.prepare(
    'SELECT * FROM categories WHERE id = ? AND user_id = ?',
  ).bind(catId, uid).first();

  if (!existing) {
    return c.json({ success: false, error: 'Category not found' }, 404);
  }

  const body = await c.req.json<Record<string, unknown>>();

  const fields: string[] = [];
  const values: unknown[] = [];

  if ('budget_limit' in body) {
    fields.push('budget_limit = ?');
    values.push(body.budget_limit as number | null);
  }
  if ('colour_hex' in body) {
    fields.push('colour_hex = ?');
    values.push(body.colour_hex as string);
  }

  if (fields.length === 0) {
    return c.json({ success: false, error: 'No updatable fields provided (budget_limit, colour_hex)' }, 400);
  }

  values.push(catId, uid);
  await c.env.DB.prepare(
    `UPDATE categories SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
  ).bind(...values).run();

  const updated = await c.env.DB.prepare(
    'SELECT * FROM categories WHERE id = ?',
  ).bind(catId).first();

  return c.json({ success: true, data: updated });
});

export default categories;
