import { Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { createPinoLogger } from "#pino-logger.js";

describe("createPinoLogger", () => {
  it("writes JSON log lines to a stream", () => {
    const chunks: string[] = [];
    const stream = new Writable({
      write(chunk, _enc, cb) {
        chunks.push(String(chunk));
        cb();
      },
    });
    const logger = createPinoLogger({ name: "test", stream, level: "info", sync: true });
    logger.info("hello", { route: "/health" });
    logger.debug("skipped");
    const line = chunks.join("").trim();
    expect(line).toContain('"msg":"hello"');
    expect(line).toContain('"route":"/health"');
    expect(line).not.toContain("skipped");
  });

  it("forwards debug, warn, error, and child bindings, remapping error to err", () => {
    const chunks: string[] = [];
    const stream = new Writable({
      write(chunk, _enc, cb) {
        chunks.push(String(chunk));
        cb();
      },
    });
    const logger = createPinoLogger({ name: "test", stream, level: "debug", sync: true });
    logger.debug("d");
    logger.warn("w");
    logger.child({ requestId: "r1" }).error("boom", { error: new Error("nope") });
    const text = chunks.join("");
    expect(text).toContain('"msg":"d"');
    expect(text).toContain('"msg":"w"');
    expect(text).toContain('"msg":"boom"');
    expect(text).toContain('"requestId":"r1"');
    expect(text).toContain('"err"');
    expect(text).not.toContain('"error":');
  });
});
