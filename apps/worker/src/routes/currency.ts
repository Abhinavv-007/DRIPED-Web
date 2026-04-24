import { Hono } from 'hono';
import type { Env } from '../types';
import { getCurrencyRates } from '../lib/currency_refresh';

const currency = new Hono<{
  Bindings: Env;
  Variables: { user: { uid: string; email: string } };
}>();

// GET /currency/rates
currency.get('/rates', async (c) => {
  try {
    const data = await getCurrencyRates(c.env.KV, c.env.EXCHANGE_RATE_API_KEY);
    return c.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch rates';
    return c.json({ success: false, error: message }, 502);
  }
});

export default currency;
