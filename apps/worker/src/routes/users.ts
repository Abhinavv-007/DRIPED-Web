import { Hono } from 'hono';
import type { Env } from '../types';
import { seedDefaultCategories } from '../db/seeds';

const users = new Hono<{
  Bindings: Env;
  Variables: { user: { uid: string; email: string } };
}>();

// POST /users/sync — upsert user, seed categories if new
users.post('/sync', async (c) => {
  const { uid } = c.get('user');
  const body = await c.req.json<{
    email: string;
    full_name?: string;
    avatar_url?: string;
    currency?: string;
  }>();

  if (!body.email) {
    return c.json({ success: false, error: 'email is required' }, 400);
  }

  // Check if user already exists
  const existing = await c.env.DB.prepare(
    'SELECT id FROM users WHERE id = ?',
  ).bind(uid).first();

  const isNew = !existing;

  // Upsert
  await c.env.DB.prepare(
    `INSERT INTO users (id, email, full_name, avatar_url, currency)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       email = excluded.email,
       full_name = excluded.full_name,
       avatar_url = excluded.avatar_url,
       currency = excluded.currency`,
  ).bind(
    uid,
    body.email,
    body.full_name || null,
    body.avatar_url || null,
    body.currency || 'INR',
  ).run();

  // Seed default categories for new users
  if (isNew) {
    await seedDefaultCategories(uid, c.env.DB);
  }

  // Return full user row
  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE id = ?',
  ).bind(uid).first();

  return c.json({ success: true, data: user });
});

export default users;
