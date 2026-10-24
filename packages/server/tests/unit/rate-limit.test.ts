import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRateLimiter } from "#index.js";

describe("MemoryRateLimiter", () => {
  it("allows up to the limit, then denies", () => {
    const limiter = new MemoryRateLimiter();
    expect(limiter.allow("k", 2)).toBe(true);
    expect(limiter.allow("k", 2)).toBe(true);
    expect(limiter.allow("k", 2)).toBe(false);
  });

  it("tracks keys independently", () => {
    const limiter = new MemoryRateLimiter();
    expect(limiter.allow("a", 1)).toBe(true);
    expect(limiter.allow("b", 1)).toBe(true);
    expect(limiter.allow("a", 1)).toBe(false);
  });

  it("denies everything when the limit is not positive", () => {
    const limiter = new MemoryRateLimiter();
    expect(limiter.allow("k", 0)).toBe(false);
    expect(limiter.allow("k", -1)).toBe(false);
    expect(limiter.allow("k", Number.NaN)).toBe(false);
  });

  describe("window expiry", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("resets after 60 seconds", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
      const limiter = new MemoryRateLimiter();
      expect(limiter.allow("k", 1)).toBe(true);
      expect(limiter.allow("k", 1)).toBe(false);
      vi.advanceTimersByTime(60_000);
      expect(limiter.allow("k", 1)).toBe(true);
    });
  });
});
