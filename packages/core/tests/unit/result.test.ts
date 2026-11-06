import { describe, expect, expectTypeOf, it } from "vitest";
import {
  err,
  isErr,
  isOk,
  mapResult,
  ok,
  type Result,
  unwrapOr,
} from "#result.js";

describe("ok / err", () => {
  it("ok carries value", () => {
    const r = ok(42);
    expect(r).toEqual({ ok: true, value: 42 });
    expect(isOk(r)).toBe(true);
    expect(isErr(r)).toBe(false);
  });

  it("err carries error", () => {
    const e = new Error("nope");
    const r = err(e);
    expect(r).toEqual({ ok: false, error: e });
    expect(isErr(r)).toBe(true);
    expect(isOk(r)).toBe(false);
  });

  it("types narrow with isOk / isErr", () => {
    const r: Result<number, string> = ok(1);
    if (isOk(r)) {
      expectTypeOf(r.value).toEqualTypeOf<number>();
    }
    const bad: Result<number, string> = err("x");
    if (isErr(bad)) {
      expectTypeOf(bad.error).toEqualTypeOf<string>();
    }
  });
});

describe("mapResult", () => {
  it("maps ok values", () => {
    const r = mapResult(ok(2), (n) => n * 3);
    expect(r).toEqual({ ok: true, value: 6 });
  });

  it("passes through errors", () => {
    const e = new Error("stay");
    const r = mapResult(err(e), (n: number) => n + 1);
    expect(r).toEqual({ ok: false, error: e });
  });
});

describe("unwrapOr", () => {
  it("returns value when ok", () => {
    expect(unwrapOr(ok("a"), "fallback")).toBe("a");
  });

  it("returns fallback when err", () => {
    expect(unwrapOr(err(new Error("x")), "fallback")).toBe("fallback");
  });
});
