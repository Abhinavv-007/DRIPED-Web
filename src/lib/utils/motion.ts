/**
 * Shared motion helpers — pin animation costs even on long lists.
 *
 * Why this exists: every page used to spell out `transition={{ delay: i *
 * 0.03 }}` inline, so once a user had 60 subscriptions the last item
 * waited 1.8 s to fade in and the whole dashboard felt laggy on first
 * paint. These helpers cap the total cascade so the longest list still
 * finishes ramping in well under 250 ms regardless of length.
 */

const STAGGER_STEP = 0.022; // ≈ 22 ms between siblings — tight but legible
const MAX_STAGGER_INDEX = 10; // cap so list 11+ all share the same delay

/**
 * Snap-in stagger delay for grid/list items. Use as
 * `transition={{ delay: staggerDelay(index) }}`.
 */
export function staggerDelay(index: number): number {
  return Math.min(index, MAX_STAGGER_INDEX) * STAGGER_STEP;
}

/**
 * Slightly longer per-step delay for hero "title cards" where you want
 * the cascade to read as deliberate (max ~5 items typically).
 */
export function heroStaggerDelay(index: number): number {
  return Math.min(index, MAX_STAGGER_INDEX) * 0.04;
}

/**
 * Default fade-up motion props. Pair with `transition={{ delay: staggerDelay(i) }}`
 * for the parent or omit when you want the snap-in only on mount.
 */
export const fadeUpVariant = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
} as const;

export const fadeInVariant = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
} as const;
