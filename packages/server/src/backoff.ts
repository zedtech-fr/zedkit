// Original work by the same author.
/**
 * Retry backoff: 2s x 3^(n-1) with +/-20% jitter, floored at 1s and
 * capped at 1h. attemptNo is 1-based (the attempt that just failed).
 * `random` is injectable so tests are deterministic.
 */
export function computeBackoffMs(
  attemptNo: number,
  random: () => number = Math.random,
): number {
  if (!Number.isInteger(attemptNo) || attemptNo < 1) {
    throw new Error(`attempt number must be a positive integer, got ${attemptNo}`);
  }
  const base = Math.min(2_000 * 3 ** (attemptNo - 1), 3_600_000);
  const jittered = Math.round(base * (0.8 + 0.4 * random()));
  return Math.max(1_000, Math.min(jittered, 3_600_000));
}
