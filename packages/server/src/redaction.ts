// Original work by the same author. Generalized from a logger helper: the
// private key-material pattern was dropped; only generic secret shapes
// (secret-like keys, bearer tokens) and long-value truncation remain.
/**
 * Recursively replace credential-looking material with placeholders, so a
 * structure is safe to log. Objects keep their shape; values under
 * secret-like keys become "[redacted]", bearer tokens become
 * "Bearer [redacted]", and strings over 64 chars are truncated.
 */
const SECRET_KEY_PATTERN =
  /(api[_-]?key|secret|token|password|signature|authorization|cookie|set-cookie)/i;
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const LONG_VALUE_MAX = 64;

export function redactValue(value: unknown, key?: string): unknown {
  if (key !== undefined && SECRET_KEY_PATTERN.test(key)) {
    return "[redacted]";
  }
  if (typeof value === "string") {
    const out = value.replace(BEARER_PATTERN, "Bearer [redacted]");
    if (out.length > LONG_VALUE_MAX) return `${out.slice(0, LONG_VALUE_MAX)}…`;
    return out;
  }
  if (Array.isArray(value)) return value.map((v) => redactValue(v));
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = redactValue(v, k);
    return out;
  }
  return value;
}
