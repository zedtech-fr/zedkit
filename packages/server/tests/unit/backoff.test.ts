import { describe, expect, it } from "vitest";
import { computeBackoffMs } from "#index.js";

describe("computeBackoffMs", () => {
  it("grows exponentially from 2s and caps at 1h", () => {
    const noJitter = () => 0.5; // midpoint: factor exactly 1
    expect(computeBackoffMs(1, noJitter)).toBe(2_000);
    expect(computeBackoffMs(2, noJitter)).toBe(6_000);
    expect(computeBackoffMs(3, noJitter)).toBe(18_000);
    expect(computeBackoffMs(4, noJitter)).toBe(54_000);
    expect(computeBackoffMs(10, noJitter)).toBe(3_600_000);
    expect(computeBackoffMs(100, noJitter)).toBe(3_600_000);
  });

  it("jitters within +/-20% and never below 1s", () => {
    expect(computeBackoffMs(1, () => 0)).toBe(1_600);
    expect(computeBackoffMs(1, () => 1)).toBe(2_400);
    for (let i = 0; i < 100; i++) {
      const value = computeBackoffMs(2, Math.random);
      expect(value).toBeGreaterThanOrEqual(4_800);
      expect(value).toBeLessThanOrEqual(7_200);
    }
  });

  it("rejects non-positive attempt numbers", () => {
    expect(() => computeBackoffMs(0, () => 0.5)).toThrow(/attempt/);
    expect(() => computeBackoffMs(-1, () => 0.5)).toThrow(/attempt/);
    expect(() => computeBackoffMs(1.5, () => 0.5)).toThrow(/attempt/);
  });

  it("stays capped with full jitter and falls back on broken RNG", () => {
    expect(computeBackoffMs(10, () => 1)).toBe(3_600_000);
    expect(computeBackoffMs(1, () => Number.NaN)).toBe(2_000);
  });
});
