import request from "supertest";
import { describe, expect, it } from "vitest";
import { boot, captureStream, waitForLogs } from "./helpers.js";

// NOTE: the request logger is process-wide (one pino instance per process),
// so the first app booted in this file owns the log destination. Log-capture
// tests live in their own files — one logger config per file.
describe("request logging", () => {
  it("redacts credentials from request logs and logs stacks on 5xx", async () => {
    const { stream, text } = captureStream();
    const { url } = await boot({ logger: { level: "info", stream } });
    await request(url)
      .get("/items")
      .set("authorization", "Bearer SECRET-TOKEN")
      .set("cookie", "s=SECRET-COOKIE");
    await request(url).get("/items/boom");
    const logs = await waitForLogs(text, "kaboom");
    expect(logs).toContain("/items");
    expect(logs).not.toContain("SECRET-TOKEN");
    expect(logs).not.toContain("SECRET-COOKIE");
    expect(logs).toContain("inventory.module");
  });
});
