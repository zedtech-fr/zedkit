import { describe, expect, it } from "vitest";
import { redactValue } from "#index.js";

describe("redactValue", () => {
  it("redacts values under secret-like keys", () => {
    expect(redactValue("hunter2", "password")).toBe("[redacted]");
    expect(redactValue("abc", "X-Api-Key")).toBe("[redacted]");
    expect(redactValue("abc", "authorization")).toBe("[redacted]");
    expect(redactValue("visible", "username")).toBe("visible");
  });

  it("redacts bearer tokens inside strings", () => {
    expect(redactValue("call with Bearer abcDEF123._~+/=-")).toBe(
      "call with Bearer [redacted]",
    );
  });

  it("truncates long strings", () => {
    const long = "x".repeat(100);
    const out = redactValue(long) as string;
    expect(out).toBe(`${"x".repeat(64)}…`);
    expect(redactValue("short")).toBe("short");
  });

  it("recurses into objects and arrays, keeping shape", () => {
    expect(
      redactValue({ user: "u", token: "t", nested: { secret: "s" }, list: ["a", "b"] }),
    ).toEqual({
      user: "u",
      token: "[redacted]",
      nested: { secret: "[redacted]" },
      list: ["a", "b"],
    });
  });

  it("passes non-string scalars through", () => {
    expect(redactValue(42)).toBe(42);
    expect(redactValue(null)).toBe(null);
    expect(redactValue(undefined)).toBe(undefined);
    expect(redactValue(true)).toBe(true);
  });
});
