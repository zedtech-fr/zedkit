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

  it("redacts common secret key names", () => {
    for (const key of ["privateKey", "private_key", "credentials", "passwd"]) {
      expect(redactValue("SUPERSECRET", key)).toBe("[redacted]");
    }
  });

  it("returns [circular] for cyclic structures", () => {
    const obj: Record<string, unknown> = {};
    obj.self = obj;
    expect(redactValue(obj)).toEqual({ self: "[circular]" });
    const arr: unknown[] = [];
    arr.push(arr);
    expect(redactValue(arr)).toEqual(["[circular]"]);
  });

  it("redacts basic credentials in strings", () => {
    expect(redactValue("Authorization: Basic dXNlcjpwYXNz")).toBe(
      "Authorization: Basic [redacted]",
    );
  });

  it("preserves dates, maps, sets, and symbol keys", () => {
    const date = new Date("2026-01-01T00:00:00Z");
    expect(redactValue(date)).toBe(date);
    const sym = Symbol("s");
    const out = redactValue({
      at: date,
      m: new Map([["token", "t"]]),
      s: new Set(["Bearer abc"]),
      [sym]: "v",
    }) as { m: Map<string, string>; s: Set<string> } & Record<symbol, unknown>;
    expect(out.m).toBeInstanceOf(Map);
    expect(out.m.get("token")).toBe("[redacted]");
    expect([...out.s][0]).toBe("Bearer [redacted]");
    expect(out[sym]).toBe("v");
  });

  it("keeps class instances usable", () => {
    class Creds {
      token = "t";
      user = "u";
    }
    const out = redactValue(new Creds()) as Creds;
    expect(out).toBeInstanceOf(Creds);
    expect(out.token).toBe("[redacted]");
    expect(out.user).toBe("u");
  });

  it("does not split surrogate pairs when truncating", () => {
    expect(redactValue("x".repeat(63) + "😀")).toBe("x".repeat(63) + "😀");
    expect(redactValue("x".repeat(64) + "😀")).toBe(`${"x".repeat(64)}…`);
  });
});
