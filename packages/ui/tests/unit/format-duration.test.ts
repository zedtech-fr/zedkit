import { describe, expect, it } from "vitest";

import { formatDuration } from "#index.js";

describe("formatDuration", () => {
  it("formats milliseconds under an hour as m ss", () => {
    expect(formatDuration(377_000)).toBe("6m 17s");
  });

  it("formats milliseconds of an hour or more as h mm", () => {
    expect(formatDuration(3_720_000)).toBe("1h 02m");
  });

  it("formats a start/end span the same as milliseconds", () => {
    expect(formatDuration({ start: 0, end: 377_000 })).toBe("6m 17s");
    expect(formatDuration({ start: 1_000, end: 3_721_000 })).toBe("1h 02m");
  });

  it("pads the lesser unit and keeps a leading zero unit", () => {
    expect(formatDuration(0)).toBe("0m 00s");
    expect(formatDuration(999)).toBe("0m 00s");
    expect(formatDuration(1_000)).toBe("0m 01s");
    expect(formatDuration(61_000)).toBe("1m 01s");
    expect(formatDuration(3_600_000)).toBe("1h 00m");
    expect(formatDuration(90 * 60_000)).toBe("1h 30m");
  });

  it("clamps negative, inverted, and non-finite spans to zero", () => {
    expect(formatDuration(-1_000)).toBe("0m 00s");
    expect(formatDuration({ start: 5_000, end: 1_000 })).toBe("0m 00s");
    expect(formatDuration(Number.NaN)).toBe("0m 00s");
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe("0m 00s");
    expect(formatDuration({ start: new Date(Number.NaN), end: new Date(1_000) })).toBe("0m 00s");
  });

  it("accepts Date instants", () => {
    expect(formatDuration({ start: new Date(0), end: new Date(377_000) })).toBe("6m 17s");
  });

  it("uses the locale for digits and keeps h/m/s letters", () => {
    expect(formatDuration(1_000, "en")).toBe("0m 01s");
    expect(formatDuration(3_720_000, "fr")).toBe("1h 02m");
    expect(formatDuration(1_000, "ar-EG")).toBe("٠m ٠١s");
  });

  it("falls back to English digits when the locale tag is invalid", () => {
    expect(formatDuration(1_000, "!!!")).toBe("0m 01s");
    expect(formatDuration(1_000, "")).toBe("0m 01s");
  });

  it("drops leftover seconds once hours show, and keeps hours past a day", () => {
    expect(formatDuration(3_721_000)).toBe("1h 02m");
    expect(formatDuration(25 * 3_600_000)).toBe("25h 00m");
  });
});
