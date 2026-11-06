import { describe, expect, expectTypeOf, it } from "vitest";
import {
  normalizeThrown,
  tryCatch,
  tryCatchAsync,
  type Result,
} from "#index.js";

describe("normalizeThrown", () => {
  it("returns Error instances unchanged", () => {
    const e = new Error("orig");
    expect(normalizeThrown(e)).toBe(e);
  });

  it("wraps non-Error with cause", () => {
    const wrapped = normalizeThrown("boom");
    expect(wrapped).toBeInstanceOf(Error);
    expect(wrapped.message).toBe("boom");
    expect(wrapped.cause).toBe("boom");
  });
});

describe("tryCatch", () => {
  it("returns ok on success", () => {
    const r = tryCatch(() => 7);
    expect(r).toEqual({ ok: true, value: 7 });
    expectTypeOf(r).toEqualTypeOf<Result<number, Error>>();
  });

  it("returns err on sync throw (Error)", () => {
    const inner = new Error("sync");
    const r = tryCatch(() => {
      throw inner;
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toBe(inner);
    }
  });

  it("wraps non-Error throw and keeps cause", () => {
    const r = tryCatch(() => {
      throw { code: 418 };
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.message).toBe("[object Object]");
      expect(r.error.cause).toEqual({ code: 418 });
    }
  });
});

describe("tryCatchAsync", () => {
  it("returns ok on resolved promise", async () => {
    const r = await tryCatchAsync(async () => "done");
    expect(r).toEqual({ ok: true, value: "done" });
  });

  it("returns err on rejection (Error)", async () => {
    const inner = new Error("async");
    const r = await tryCatchAsync(async () => {
      throw inner;
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toBe(inner);
    }
  });

  it("wraps non-Error rejection with cause", async () => {
    const r = await tryCatchAsync(async () => {
      throw "reject-string";
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.message).toBe("reject-string");
      expect(r.error.cause).toBe("reject-string");
    }
  });

  it("returns err when fn throws before returning a promise", async () => {
    // Pins the deferred call: fn runs inside .then, so a sync throw
    // becomes a rejection instead of escaping.
    const r = await tryCatchAsync(() => {
      throw new Error("sync");
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.message).toBe("sync");
    }
  });
});
