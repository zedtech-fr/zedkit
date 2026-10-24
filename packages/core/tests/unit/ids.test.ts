import { describe, expect, it } from "vitest";
import { isPrefixedId, newPrefixedId } from "#index.js";

describe("newPrefixedId", () => {
  it("returns <prefix>_<26-char ULID>", () => {
    const id = newPrefixedId("order");
    expect(id).toMatch(/^order_[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it("is unique across calls", () => {
    expect(newPrefixedId("a")).not.toBe(newPrefixedId("a"));
  });

  it("rejects empty or underscore prefixes", () => {
    expect(() => newPrefixedId("")).toThrow(/invalid id prefix/);
    expect(() => newPrefixedId("has_underscore")).toThrow(/invalid id prefix/);
  });
});

describe("isPrefixedId", () => {
  it("round-trips", () => {
    expect(isPrefixedId(newPrefixedId("order"), "order")).toBe(true);
  });

  it("rejects wrong prefix, shape, and case", () => {
    const id = newPrefixedId("order");
    expect(isPrefixedId(id, "other")).toBe(false);
    expect(isPrefixedId("order_short", "order")).toBe(false);
    expect(isPrefixedId("order_" + "x".repeat(26), "order")).toBe(false);
    expect(isPrefixedId("not-an-id", "order")).toBe(false);
  });
});
