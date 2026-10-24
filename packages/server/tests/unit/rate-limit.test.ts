import { describe, expect, it } from "vitest";
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
});
