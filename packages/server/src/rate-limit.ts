// Original work by the same author.
/**
 * Fixed-window rate limiter, in-process. Correct for single-instance
 * deployments; multi-instance enforcement needs a shared store behind the
 * same allow() shape.
 */
const WINDOW_MS = 60_000;
const MAX_KEYS_BEFORE_GC = 10_000;

export class MemoryRateLimiter {
  private readonly windows = new Map<string, { start: number; count: number }>();
  private lastGc = 0;

  allow(key: string, limitPerMinute: number): boolean {
    // Fail closed on misconfiguration: a non-positive limit denies.
    if (!(limitPerMinute >= 1)) return false;
    if (key.trim().length === 0) return false;
    const now = Date.now();
    const current = this.windows.get(key);
    if (!current || now - current.start >= WINDOW_MS) {
      this.maybeGc(now);
      this.windows.set(key, { start: now, count: 1 });
      return true;
    }
    if (current.count >= limitPerMinute) return false;
    current.count += 1;
    return true;
  }

  // Drops expired windows, but at most once per window: past the key
  // cap, every insert would otherwise pay a full-map scan.
  private maybeGc(now: number): void {
    if (this.windows.size <= MAX_KEYS_BEFORE_GC) return;
    if (now - this.lastGc < WINDOW_MS) return;
    this.lastGc = now;
    for (const [k, v] of this.windows) {
      if (now - v.start >= WINDOW_MS) this.windows.delete(k);
    }
  }
}
