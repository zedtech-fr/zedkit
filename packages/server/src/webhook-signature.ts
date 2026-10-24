// Sign ported from production delivery code; verify mirrors it with a
// timing-safe compare. Original work by the same author.
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stripe-style signature header binding timestamp and exact body bytes:
 * `t=<unix-seconds>,v1=<hex hmac-sha256(secret, "<ts>.<body>")>`.
 * Receivers recompute over the raw bytes they received. Bring your own
 * secret (32+ random bytes); version rotation stays in the consumer.
 */
export function webhookSignatureHeader(
  secret: Buffer,
  body: Buffer,
  timestamp: string,
): string {
  const mac = createHmac("sha256", secret)
    .update(`${timestamp}.`, "utf8")
    .update(body)
    .digest("hex");
  return `t=${timestamp},v1=${mac}`;
}

export interface VerifyWebhookOptions {
  /**
   * Reject signatures older than this, in seconds. Omit for no freshness
   * check. Fold clock skew into the value; future timestamps are rejected.
   */
  maxAgeSeconds?: number;
  /** Clock for the freshness check (injectable for tests). Defaults to Date.now. */
  now?: () => number;
}

/** Recompute the header over the received bytes and compare timing-safely. */
export function verifyWebhookSignatureHeader(
  secret: Buffer,
  body: Buffer,
  header: string | null | undefined,
  options: VerifyWebhookOptions = {},
): boolean {
  if (!header) return false;
  const match = /^t=(\d+),v1=([0-9a-f]+)$/.exec(header);
  if (!match) return false;
  const timestamp = match[1];
  if (timestamp === undefined) return false;
  const expected = webhookSignatureHeader(secret, body, timestamp);
  const a = Buffer.from(header, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  if (options.maxAgeSeconds !== undefined) {
    const now = options.now ? options.now() : Date.now();
    const ageMs = now - Number(timestamp) * 1000;
    if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > options.maxAgeSeconds * 1000) {
      return false;
    }
  }
  return true;
}
