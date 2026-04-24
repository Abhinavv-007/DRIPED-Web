/* Sample receipts \u2014 for manual smoke testing the pipeline. */
import { extractFromEmail, aggregate } from '../src/index';

const samples = [
  {
    subject: 'Your Netflix receipt',
    from: 'Netflix <info@mailer.netflix.com>',
    body: `Hi, thanks for being a member. We\u2019ve charged your card \u20B9 649.00 for the Standard plan.\nNext billing date: 15 May 2026.`,
  },
  {
    subject: 'Spotify Premium is renewing',
    from: 'no-reply@spotify.com',
    body: `Your Premium Individual plan renews on 2026-05-09. You\u2019ll be charged $10.99/month.`,
  },
  {
    subject: 'Your Amazon Prime membership has been renewed',
    from: 'auto-confirm@amazon.in',
    body: `We\u2019ve processed Rs. 1,499 for your yearly Amazon Prime membership. Next renewal: 12/04/2027.`,
  },
  {
    subject: 'Claude Pro \u2014 receipt for April',
    from: 'billing@anthropic.com',
    body: `Payment received: $20.00 for Claude Pro monthly subscription. Renews on May 3, 2026.`,
  },
  {
    subject: 'Order refunded',
    from: 'no-reply@someshop.com',
    body: `We have refunded $9.99 to your card. This is not a subscription charge.`,
  },
];

async function run() {
  const parsed = await Promise.all(samples.map((s) => extractFromEmail(s)));
  for (const p of parsed) {
    console.log(JSON.stringify({
      merchant: p.merchant?.slug,
      amount: p.amount,
      cycle: p.cycle,
      renewal: p.renewalDate?.iso,
      receiptType: p.receiptType,
      confidence: p.overallConfidence,
      needsReview: p.needsReview,
    }, null, 0));
  }
  const aggregated = await aggregate(parsed);
  console.log('\nAggregated:');
  for (const a of aggregated) {
    console.log(`  ${a.merchantName}: ${a.currency ?? '?'} ${a.amount ?? '?'} / ${a.cycle ?? '?'} (receipts=${a.receiptCount}, conf=${a.confidence})`);
  }
}

run().catch(console.error);
