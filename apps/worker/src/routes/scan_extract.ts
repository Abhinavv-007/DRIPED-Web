import { Hono } from 'hono';
import type { Env, ScanExtractBody, ScanFeedbackBody } from '../types';
import { VALID_FEEDBACK_VERDICTS } from '../types';
import { extractSubscriptionFromEmail } from '../lib/scan_ai';

const scanExtract = new Hono<{
  Bindings: Env;
  Variables: { user: { uid: string; email: string } };
}>();

// POST /scan/extract \u2014 AI-powered structured extraction from a raw email
scanExtract.post('/extract', async (c) => {
  const { uid } = c.get('user');
  const body = await c.req.json<ScanExtractBody>();

  if (!body.email_body || typeof body.email_body !== 'string') {
    return c.json({ success: false, error: 'email_body required' }, 400);
  }

  // Rate limit: 100 extractions per user per minute
  const rlKey = `rl:scan:${uid}:${Math.floor(Date.now() / 60000)}`;
  const count = parseInt((await c.env.KV.get(rlKey)) ?? '0', 10);
  if (count >= 100) {
    return c.json({ success: false, error: 'Rate limit exceeded. Try again in a minute.' }, 429);
  }
  await c.env.KV.put(rlKey, String(count + 1), { expirationTtl: 120 });

  const result = await extractSubscriptionFromEmail(c.env, body);
  return c.json({ success: true, data: result });
});

// POST /scan/feedback \u2014 improve future extractions
scanExtract.post('/feedback', async (c) => {
  const { uid } = c.get('user');
  const body = await c.req.json<ScanFeedbackBody>();

  if (!body.email_hash || !body.verdict) {
    return c.json({ success: false, error: 'email_hash + verdict required' }, 400);
  }
  if (!VALID_FEEDBACK_VERDICTS.includes(body.verdict)) {
    return c.json({ success: false, error: 'Invalid verdict' }, 400);
  }

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO scan_feedback
     (id, user_id, email_hash, detected_slug, correct_slug, verdict, payload_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    id, uid, body.email_hash,
    body.detected_slug ?? null,
    body.correct_slug ?? null,
    body.verdict,
    body.payload ? JSON.stringify(body.payload) : null,
  ).run();

  // Invalidate AI cache so next extraction re-runs with fresh context
  await c.env.KV.delete(`scan:extract:${body.email_hash}`);

  return c.json({ success: true, data: { id } });
});

export default scanExtract;
