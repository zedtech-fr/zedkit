import { describe, expect, it } from "vitest";
import { fixedClock, systemClock } from "#index.js";

describe("clock", () => {
  it("systemClock returns a Date", () => {
    const before = Date.now();
    const at = systemClock.now();
    expect(at.getTime()).toBeGreaterThanOrEqual(before);
  });

  it("fixedClock always returns the same instant", () => {
    const instant = new Date("2026-01-15T12:00:00.000Z");
    const clock = fixedClock(instant);
    expect(clock.now().toISOString()).toBe(instant.toISOString());
    expect(clock.now().toISOString()).toBe(instant.toISOString());
  });
});
