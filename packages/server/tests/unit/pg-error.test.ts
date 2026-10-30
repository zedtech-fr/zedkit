import { describe, expect, it } from "vitest";
import { pgErrorCode, pgErrorRetryable } from "#index.js";

describe("pgErrorCode", () => {
  it("reads string codes and rejects anything else", () => {
    expect(pgErrorCode({ code: "23505" })).toBe("23505");
    expect(pgErrorCode({ code: 23505 })).toBe(null);
    expect(pgErrorCode(new Error("boom"))).toBe(null);
    expect(pgErrorCode(null)).toBe(null);
    expect(pgErrorCode("23505")).toBe(null);
  });
});

describe("pgErrorRetryable", () => {
  it("returns null without a Postgres code", () => {
    expect(pgErrorRetryable(new Error("boom"))).toBe(null);
    expect(pgErrorRetryable(null)).toBe(null);
  });

  it("marks serialization and deadlock as retryable", () => {
    expect(pgErrorRetryable({ code: "40001" })).toBe(true);
    expect(pgErrorRetryable({ code: "40P01" })).toBe(true);
  });

  it("does not retry integrity violations", () => {
    expect(pgErrorRetryable({ code: "23505" })).toBe(false);
    expect(pgErrorRetryable({ code: "23503" })).toBe(false);
    expect(pgErrorRetryable({ code: "23502" })).toBe(false);
  });
});
