import type { Env, PushSubscriptionRow } from '../types';
import { sendWebPush, sendFcm, type PushPayload } from './webpush';

/// Fetch all push endpoints for a user and fire the given payload to each.
/// Deletes endpoints that return 404/410 (unsubscribed).
export async function pushToUser(
  env: Env,
  userId: string,
  payload: PushPayload,
): Promise<{ sent: number; failed: number }> {
  const subs = await env.DB
    .prepare('SELECT * FROM push_subscriptions WHERE user_id = ?')
    .bind(userId)
    .all<PushSubscriptionRow>();

  let sent = 0;
  let failed = 0;
  const toDelete: string[] = [];

  for (const sub of subs.results ?? []) {
    try {
      let result: { ok: boolean; status: number };
      if (sub.platform === 'web') {
        if (!sub.p256dh || !sub.auth_secret) { failed++; continue; }
        result = await sendWebPush(env, {
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth_secret,
        }, payload);
      } else if (sub.platform === 'android' || sub.platform === 'ios') {
        result = await sendFcm(env, sub.endpoint, payload);
      } else {
        failed++;
        continue;
      }

      if (result.ok) {
        sent++;
      } else {
        failed++;
        if (result.status === 404 || result.status === 410) {
          toDelete.push(sub.id);
        }
      }
    } catch {
      failed++;
    }
  }

  // Purge dead endpoints
  for (const id of toDelete) {
    await env.DB.prepare('DELETE FROM push_subscriptions WHERE id = ?').bind(id).run();
  }

  return { sent, failed };
}
