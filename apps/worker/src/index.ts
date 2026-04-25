import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import { firebaseAuth } from './middleware/auth';
import users from './routes/users';
import subscriptions from './routes/subscriptions';
import paymentMethods from './routes/payment_methods';
import categories from './routes/categories';
import paymentHistory from './routes/payment_history';
import currency from './routes/currency';
import scanLog from './routes/scan_log';
import push from './routes/push';
import scanExtract from './routes/scan_extract';
import merchants from './routes/merchants';
import insights from './routes/insights';
import preferences from './routes/preferences';
import sessions from './routes/sessions';
import receipts from './routes/receipts';
import { getCurrencyRates } from './lib/currency_refresh';
import { dispatchRenewalReminders, dispatchMonthlySummary } from './lib/cron_tasks';

const app = new Hono<{
  Bindings: Env;
  Variables: { user: { uid: string; email: string } };
}>();

// CORS \u2014 explicit allowlist for production. Any localhost/127.0.0.1
// port is accepted automatically for local dev (Next.js + browser preview
// proxy ports vary).
const ALLOWED_ORIGINS = [
  'https://driped.in',
  'https://www.driped.in',
  'https://app.driped.in',
];
const LOCAL_DEV_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
app.use('*', cors({
  origin: (origin) => {
    if (!origin) return '*';
    if (ALLOWED_ORIGINS.includes(origin)) return origin;
    if (LOCAL_DEV_ORIGIN.test(origin)) return origin;
    return ALLOWED_ORIGINS[0];
  },
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Device-Id', 'X-Client-Platform'],
  maxAge: 86400,
}));

// Health check — no auth required. Both `/` and `/health` for smoke tests.
const health = (c: { json: (v: unknown) => Response }) =>
  c.json({
    status: 'ok',
    service: 'driped-worker',
    version: '2.0.0',
    time: new Date().toISOString(),
  });
app.get('/', health);
app.get('/health', health);

// Public routes
app.route('/currency', currency);

// All other routes require Firebase auth
app.use('*', firebaseAuth);

// Mount routes
app.route('/users', users);
app.route('/subscriptions', subscriptions);
app.route('/payment-methods', paymentMethods);
app.route('/categories', categories);
app.route('/payment-history', paymentHistory);
app.route('/scan', scanLog);
// V2 \u2014 extractor, merchants, insights, push, prefs, sessions, receipts
app.route('/scan', scanExtract);
app.route('/merchants', merchants);
app.route('/insights', insights);
app.route('/push', push);
app.route('/preferences', preferences);
app.route('/sessions', sessions);
app.route('/receipts', receipts);

// 404 fallback
app.notFound((c) => {
  return c.json({ success: false, error: 'Not found' }, 404);
});

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ success: false, error: 'Internal server error' }, 500);
});

export default {
  fetch: app.fetch,
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ) {
    // Cron cadence is wired in wrangler.toml. We dispatch based on the
    // scheduled cron expression (`controller.cron`).
    const cron = controller.cron;
    ctx.waitUntil((async () => {
      try {
        switch (cron) {
          case '30 18 * * *':
            // Legacy: currency refresh (18:30 UTC = midnight IST)
            await getCurrencyRates(env.KV, env.EXCHANGE_RATE_API_KEY, { forceRefresh: true });
            break;
          case '0 3 * * *': {
            // Daily renewal reminders (03:00 UTC = 08:30 IST).
            // On the 1st of each month, also kick off the monthly summary in
            // the same trigger so we stay within the 5-cron account limit.
            await dispatchRenewalReminders(env);
            const utc = new Date();
            if (utc.getUTCDate() === 1) {
              await dispatchMonthlySummary(env);
            }
            break;
          }
          default:
            // Fallback: always refresh currency
            await getCurrencyRates(env.KV, env.EXCHANGE_RATE_API_KEY, { forceRefresh: true });
        }
      } catch (err) {
        console.error('Scheduled job failed for cron', cron, err);
      }
    })());
  },
};
