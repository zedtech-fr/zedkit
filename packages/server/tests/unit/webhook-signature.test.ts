import { describe, expect, it } from "vitest";
import {
  verifyWebhookSignatureHeader,
  webhookSignatureHeader,
} from "#index.js";

const SECRET = Buffer.from("test-secret-with-32-bytes-minimum!", "utf8");
const BODY = Buffer.from('{"event":"ping"}', "utf8");
const TS = "1760000000";

describe("webhook signatures", () => {
  it("round-trips", () => {
    const header = webhookSignatureHeader(SECRET, BODY, TS);
    expect(header).toMatch(/^t=1760000000,v1=[0-9a-f]{64}$/);
    expect(verifyWebhookSignatureHeader(SECRET, BODY, header)).toBe(true);
  });

  it("rejects tampered bodies, headers, and wrong secrets", () => {
    const header = webhookSignatureHeader(SECRET, BODY, TS);
    expect(
      verifyWebhookSignatureHeader(SECRET, Buffer.from('{"event":"pong"}', "utf8"), header),
    ).toBe(false);
    expect(verifyWebhookSignatureHeader(SECRET, BODY, `${header}0`)).toBe(false);
    expect(
      verifyWebhookSignatureHeader(Buffer.from("wrong-secret-32-bytes-minimum!!", "utf8"), BODY, header),
    ).toBe(false);
  });

  it("rejects missing and malformed headers", () => {
    expect(verifyWebhookSignatureHeader(SECRET, BODY, null)).toBe(false);
    expect(verifyWebhookSignatureHeader(SECRET, BODY, "")).toBe(false);
    expect(verifyWebhookSignatureHeader(SECRET, BODY, "v1=abc")).toBe(false);
    expect(verifyWebhookSignatureHeader(SECRET, BODY, "t=abc,v1=00")).toBe(false);
    expect(verifyWebhookSignatureHeader(SECRET, BODY, "t=1,v1=zz")).toBe(false);
  });

  it("enforces freshness when asked", () => {
    const header = webhookSignatureHeader(SECRET, BODY, TS);
    const at = (ms: number) => ({ maxAgeSeconds: 300, now: () => ms });
    expect(verifyWebhookSignatureHeader(SECRET, BODY, header, at(1760000000_000))).toBe(true);
    expect(verifyWebhookSignatureHeader(SECRET, BODY, header, at(1760000300_000))).toBe(true);
    expect(verifyWebhookSignatureHeader(SECRET, BODY, header, at(1760000300_001))).toBe(false);
    expect(verifyWebhookSignatureHeader(SECRET, BODY, header, at(1759999999_000))).toBe(false);
  });

  it("accepts old signatures when freshness is not asked", () => {
    const header = webhookSignatureHeader(SECRET, BODY, "1000000000");
    expect(verifyWebhookSignatureHeader(SECRET, BODY, header)).toBe(true);
  });

  it("fails closed on invalid maxAge and missing inputs", () => {
    const header = webhookSignatureHeader(SECRET, BODY, TS);
    const old = { maxAgeSeconds: Number.NaN, now: () => 1760000000_000 + 25 * 365 * 24 * 3600 * 1000 };
    expect(verifyWebhookSignatureHeader(SECRET, BODY, header, old)).toBe(false);
    expect(
      verifyWebhookSignatureHeader(SECRET, BODY, header, { maxAgeSeconds: -1 }),
    ).toBe(false);
    expect(
      verifyWebhookSignatureHeader(SECRET, null as unknown as Buffer, header),
    ).toBe(false);
    expect(
      verifyWebhookSignatureHeader(null as unknown as Buffer, BODY, header),
    ).toBe(false);
  });

  it("rejects an empty secret", () => {
    const empty = Buffer.alloc(0);
    const header = webhookSignatureHeader(empty, BODY, TS);
    expect(verifyWebhookSignatureHeader(empty, BODY, header)).toBe(false);
    expect(verifyWebhookSignatureHeader(empty, BODY, webhookSignatureHeader(SECRET, BODY, TS))).toBe(
      false,
    );
  });
});
