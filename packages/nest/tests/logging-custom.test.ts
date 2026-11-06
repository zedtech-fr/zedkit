import request from "supertest";
import { describe, expect, it } from "vitest";
import { boot, captureStream, waitForLogs } from "./helpers.js";

// NOTE: the request logger is process-wide (one pino instance per process),
// so the first app booted in this file owns the log destination. Log-capture
// tests live in their own files — one logger config per file.
describe("custom log redaction", () => {
  it("honours custom redact paths", async () => {
    const { stream, text } = captureStream();
    const { url } = await boot({
      logger: { level: "info", stream, redact: ["req.headers.x-token"] },
    });
    await request(url).get("/items").set("x-token", "CUSTOM-SECRET");
    const logs = await waitForLogs(text, "/items");
    expect(logs).toContain("/items");
    expect(logs).not.toContain("CUSTOM-SECRET");
  });
});
