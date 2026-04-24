import { createMiddleware } from 'hono/factory';
import type { Env } from '../types';
import { verifyFirebaseToken } from '../lib/firebase_verify';

export const firebaseAuth = createMiddleware<{
  Bindings: Env;
  Variables: { user: { uid: string; email: string } };
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Missing or invalid Authorization header' }, 401);
  }

  const token = authHeader.slice(7);
  if (!token) {
    return c.json({ success: false, error: 'Empty token' }, 401);
  }

  try {
    const verified = await verifyFirebaseToken(
      token,
      c.env.FIREBASE_PROJECT_ID,
      c.env.KV,
    );
    c.set('user', verified);
    await next();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token verification failed';
    return c.json({ success: false, error: message }, 401);
  }
});
