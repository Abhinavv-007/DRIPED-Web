interface ExchangeRateResponse {
  result: string;
  base_code: string;
  conversion_rates: Record<string, number>;
}

interface CachedRates {
  rates: Record<string, number>;
  updated_at: string;
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function secondsUntilNextIstMidnight(now = new Date()): number {
  const nowMs = now.getTime();
  const istNow = new Date(nowMs + IST_OFFSET_MS);
  const nextIstMidnightMs =
    Date.UTC(
      istNow.getUTCFullYear(),
      istNow.getUTCMonth(),
      istNow.getUTCDate() + 1,
      0,
      0,
      0,
    ) - IST_OFFSET_MS;
  return Math.max(60, Math.floor((nextIstMidnightMs - nowMs) / 1000));
}

export async function getCurrencyRates(
  kv: KVNamespace,
  apiKey: string,
  options?: { forceRefresh?: boolean },
): Promise<CachedRates> {
  // Check KV cache
  const cached = await kv.get('exchange_rates', 'json') as CachedRates | null;
  if (cached && options?.forceRefresh != true) {
    return cached;
  }

  // Fetch fresh rates
  const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/INR`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Exchange rate API failed: ${res.status}`);
  }

  const data = await res.json() as ExchangeRateResponse;
  if (data.result !== 'success') {
    throw new Error('Exchange rate API returned non-success result');
  }

  const result: CachedRates = {
    rates: data.conversion_rates,
    updated_at: new Date().toISOString(),
  };

  const ttl = secondsUntilNextIstMidnight();

  // Store in KV until the next 00:00 IST refresh boundary.
  await kv.put('exchange_rates', JSON.stringify(result), {
    expirationTtl: ttl,
  });
  await kv.put('exchange_rates_updated_at', result.updated_at, {
    expirationTtl: ttl,
  });

  return result;
}
