import { describe, expect, it } from "vitest";
import {
  classifyError,
  DomainError,
  PermanentError,
  TransientError,
} from "#index.js";

describe("DomainError", () => {
  it("keeps code, message, and optional details", () => {
    const bare = new DomainError("bare_code", "bare message");
    expect(bare).toBeInstanceOf(Error);
    expect(bare).toBeInstanceOf(DomainError);
    expect(bare.name).toBe("DomainError");
    expect(bare.kind).toBe("domain");
    expect(bare.code).toBe("bare_code");
    expect(bare.message).toBe("bare message");
    expect(bare.details).toBeUndefined();
    expect(bare.cause).toBeUndefined();
    expect(classifyError(bare)).toBe("domain");

    const detailed = new DomainError("slot_unavailable", "Slot already booked", {
      slot: "10:00",
    });
    expect(detailed.details).toEqual({ slot: "10:00" });
    expect(classifyError(detailed)).toBe("domain");
  });

  it("treats a third-arg object with a cause key as details, not options", () => {
    const error = new DomainError("ambiguous", "kept as data", { cause: "stays-data" });
    expect(error.details).toEqual({ cause: "stays-data" });
    expect(error.cause).toBeUndefined();
  });

  it("preserves an optional cause via the fourth parameter", () => {
    const cause = new Error("upstream boom");
    const error = new DomainError("wrapped", "downstream view", { slot: "10:00" }, { cause });
    expect(error.cause).toBe(cause);
    expect(classifyError(error)).toBe("domain");
  });

  it("keeps cause non-enumerable", () => {
    const error = new DomainError(
      "wrapped",
      "downstream view",
      { slot: "10:00" },
      { cause: new Error("upstream boom") },
    );
    expect({ ...error }).not.toHaveProperty("cause");
    expect(JSON.stringify(error)).not.toContain("upstream boom");
  });
});

describe("classifyError", () => {
  it("maps transient and permanent classes", () => {
    expect(classifyError(new TransientError("retry me"))).toBe("transient");
    expect(classifyError(new PermanentError("dead letter"))).toBe("permanent");
  });

  it("treats unknown errors as transient", () => {
    expect(classifyError(new Error("oops"))).toBe("transient");
    expect(classifyError("string throw")).toBe("transient");
  });
});
