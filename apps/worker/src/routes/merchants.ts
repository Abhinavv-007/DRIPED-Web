import { Hono } from 'hono';
import type { Env, MerchantRow } from '../types';

const merchants = new Hono<{
  Bindings: Env;
  Variables: { user: { uid: string; email: string } };
}>();

// GET /merchants \u2014 full registry (cached in KV for 1h)
merchants.get('/', async (c) => {
  const cacheKey = 'merchants:all:v1';
  const cached = await c.env.KV.get(cacheKey, 'json');
  if (cached) return c.json({ success: true, data: cached });

  const rows = await c.env.DB
    .prepare(
      `SELECT id, slug, display_name, domains, aliases, typical_cycle,
              typical_amount, typical_currency, category_slug, icon_slug,
              cancel_url, verified, confidence_base
       FROM merchants
       ORDER BY verified DESC, slug ASC`,
    )
    .all<MerchantRow>();

  const hydrated = (rows.results ?? []).map((r) => ({
    ...r,
    domains: safeJsonArray(r.domains),
    aliases: safeJsonArray(r.aliases),
  }));

  await c.env.KV.put(cacheKey, JSON.stringify(hydrated), { expirationTtl: 3600 });
  return c.json({ success: true, data: hydrated });
});

// GET /merchants/:slug
merchants.get('/:slug', async (c) => {
  const slug = c.req.param('slug').toLowerCase();
  const row = await c.env.DB
    .prepare('SELECT * FROM merchants WHERE slug = ?')
    .bind(slug)
    .first<MerchantRow>();

  if (!row) return c.json({ success: false, error: 'Merchant not found' }, 404);

  return c.json({
    success: true,
    data: {
      ...row,
      domains: safeJsonArray(row.domains),
      aliases: safeJsonArray(row.aliases),
    },
  });
});

// POST /merchants \u2014 user-contributed (unverified). Admins flip `verified=1` later.
merchants.post('/', async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  if (!body.slug || !body.display_name) {
    return c.json({ success: false, error: 'slug + display_name required' }, 400);
  }
  const slug = String(body.slug).toLowerCase().replace(/[^a-z0-9_]+/g, '_');

  const existing = await c.env.DB
    .prepare('SELECT id FROM merchants WHERE slug = ?')
    .bind(slug)
    .first();
  if (existing) return c.json({ success: false, error: 'slug already exists' }, 409);

  const id = crypto.randomUUID();
  const domains = Array.isArray(body.domains) ? body.domains : [];
  const aliases = Array.isArray(body.aliases) ? body.aliases : [];

  await c.env.DB.prepare(
    `INSERT INTO merchants
     (id, slug, display_name, domains, aliases, typical_cycle, typical_amount,
      typical_currency, category_slug, icon_slug, cancel_url, verified, confidence_base)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 40)`,
  ).bind(
    id, slug, body.display_name as string,
    JSON.stringify(domains),
    JSON.stringify(aliases),
    (body.typical_cycle as string) ?? null,
    (body.typical_amount as number) ?? null,
    (body.typical_currency as string) ?? 'INR',
    (body.category_slug as string) ?? null,
    (body.icon_slug as string) ?? null,
    (body.cancel_url as string) ?? null,
  ).run();

  await c.env.KV.delete('merchants:all:v1');
  return c.json({ success: true, data: { id, slug } }, 201);
});

function safeJsonArray(input: string | null): unknown[] {
  if (!input) return [];
  try {
    const v = JSON.parse(input);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export default merchants;
