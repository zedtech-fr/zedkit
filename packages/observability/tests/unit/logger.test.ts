import { afterEach, describe, expect, it, vi } from "vitest";
import { createConsoleLogger, createMemoryLogger, noopLogger } from "#index.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("noopLogger", () => {
  it("drops every level", () => {
    noopLogger.debug("silent");
    noopLogger.info("silent");
    noopLogger.warn("silent");
    noopLogger.child({ scope: "x" }).error("still silent");
  });
});

describe("createMemoryLogger", () => {
  it("records levels, messages, and child bindings", () => {
    const { logger, entries } = createMemoryLogger();
    logger.debug("start");
    logger.info("boot");
    logger.error("fail", { code: 1 });
    logger.child({ requestId: "r1" }).warn("slow", { ms: 12 });
    expect(entries).toEqual([
      { level: "debug", message: "start", context: {} },
      { level: "info", message: "boot", context: {} },
      { level: "error", message: "fail", context: { code: 1 } },
      { level: "warn", message: "slow", context: { requestId: "r1", ms: 12 } },
    ]);
  });
});

describe("createConsoleLogger", () => {
  it("writes each level and child bindings to console", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => undefined);
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const logger = createConsoleLogger({ app: "kit" });
    logger.debug("d");
    logger.info("i");
    logger.warn("w");
    logger.error("e", { code: 1 });
    logger.child({ requestId: "r1" }).info("child");
    expect(debug).toHaveBeenCalledWith("d", { app: "kit" });
    expect(info).toHaveBeenCalledWith("i", { app: "kit" });
    expect(warn).toHaveBeenCalledWith("w", { app: "kit" });
    expect(error).toHaveBeenCalledWith("e", { app: "kit", code: 1 });
    expect(info).toHaveBeenCalledWith("child", { app: "kit", requestId: "r1" });
  });

  it("omits the payload when there are no bindings", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    createConsoleLogger().info("plain");
    expect(info).toHaveBeenCalledWith("plain");
  });
});
