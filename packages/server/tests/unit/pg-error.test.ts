import { describe, expect, it } from "vitest";
import { pgErrorCode } from "#index.js";

describe("pgErrorCode", () => {
  it("reads string codes and rejects anything else", () => {
    expect(pgErrorCode({ code: "23505" })).toBe("23505");
    expect(pgErrorCode({ code: 23505 })).toBe(null);
    expect(pgErrorCode(new Error("boom"))).toBe(null);
    expect(pgErrorCode(null)).toBe(null);
    expect(pgErrorCode("23505")).toBe(null);
  });
});
