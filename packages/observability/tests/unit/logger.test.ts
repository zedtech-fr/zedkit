import { describe, expect, it } from "vitest";
import { createMemoryLogger, noopLogger } from "#index.js";

describe("noopLogger", () => {
  it("drops every level", () => {
    noopLogger.info("silent");
    noopLogger.child({ scope: "x" }).error("still silent");
  });
});

describe("createMemoryLogger", () => {
  it("records levels, messages, and child bindings", () => {
    const { logger, entries } = createMemoryLogger();
    logger.info("boot");
    logger.child({ requestId: "r1" }).warn("slow", { ms: 12 });
    expect(entries).toEqual([
      { level: "info", message: "boot", context: {} },
      { level: "warn", message: "slow", context: { requestId: "r1", ms: 12 } },
    ]);
  });
});
