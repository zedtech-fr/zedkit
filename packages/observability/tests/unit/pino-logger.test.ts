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
    const line = chunks.join("").trim();
    expect(line).toContain('"msg":"hello"');
    expect(line).toContain('"route":"/health"');
  });
});
