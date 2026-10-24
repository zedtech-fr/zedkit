// Original work by the same author.
/**
 * Fixed-window rate limiter, in-process. Correct for single-instance
 * deployments; multi-instance enforcement needs a shared store behind the
 * same allow() shape.
 */
export class MemoryRateLimiter {
  private readonly windows = new Map<string, { start: number; count: number }>();

  allow(key: string, limitPerMinute: number): boolean {
    const now = Date.now();
    const windowMs = 60_000;
    const current = this.windows.get(key);
    if (!current || now - current.start >= windowMs) {
      if (this.windows.size > 10_000 && !current) this.gc(now, windowMs);
      this.windows.set(key, { start: now, count: 1 });
      return true;
    }
    if (current.count >= limitPerMinute) return false;
    current.count += 1;
    return true;
  }

  private gc(now: number, windowMs: number): void {
    for (const [k, v] of this.windows) {
      if (now - v.start >= windowMs) this.windows.delete(k);
    }
  }
}
