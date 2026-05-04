/**
 * @driped/scan — shared subscription scan engine.
 *
 * Public API surface. Everything else is internal.
 */
export * from './types';
export { extractFromEmail, mergeAiResult } from './pipeline';
export { aggregate, type AggregatedSubscription } from './dedup';
export { SEED_MERCHANTS, merchantBySlug, type SeedMerchant } from './merchants';
export { emailFingerprint, subscriptionDedupKey, sha256Hex } from './hash';
