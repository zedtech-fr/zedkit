// Original work by the same author. Generalized from a logger helper: the
// private key-material pattern was dropped; only generic secret shapes
// (secret-like keys, bearer/basic tokens) and long-value truncation remain.
/**
 * Recursively replace credential-looking material with placeholders, so a
 * structure is safe to log. Objects keep their shape and prototype; values
 * under secret-like keys become "[redacted]", bearer/basic tokens become
 * "<scheme> [redacted]", strings over 64 code points are truncated, and
 * cyclic references become "[circular]". Dates and regexes pass through
 * untouched; Maps, Sets, and symbol keys are preserved.
 */
const SECRET_KEY_PATTERN =
  /(api[_-]?key|secret|token|password|passwd|signature|authorization|cookie|set-cookie|private[_-]?key|credentials)/i;
const AUTH_TOKEN_PATTERN = /\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi;
const LONG_VALUE_MAX = 64;

function redactString(value: string): string {
  const scrubbed = value.replace(
    AUTH_TOKEN_PATTERN,
    (match) => `${match.split(/\s/, 1)[0]} [redacted]`,
  );
  // Count in code points so truncation never splits a surrogate pair.
  const chars = Array.from(scrubbed);
  if (chars.length > LONG_VALUE_MAX) {
    return `${chars.slice(0, LONG_VALUE_MAX).join("")}…`;
  }
  return scrubbed;
}

export function redactValue(value: unknown, key?: string): unknown {
  return redactInner(value, key, new Set());
}

function redactInner(value: unknown, key: string | undefined, seen: Set<object>): unknown {
  if (key !== undefined && SECRET_KEY_PATTERN.test(key)) {
    return "[redacted]";
  }
  if (typeof value === "string") {
    return redactString(value);
  }
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (seen.has(value)) {
    return "[circular]";
  }
  seen.add(value);
  if (value instanceof Date || value instanceof RegExp) {
    return value;
  }
  if (value instanceof Map) {
    return new Map(
      [...value].map(([k, v]) => [
        k,
        redactInner(v, typeof k === "string" ? k : undefined, seen),
      ]),
    );
  }
  if (value instanceof Set) {
    return new Set([...value].map((v) => redactInner(v, undefined, seen)));
  }
  if (Array.isArray(value)) {
    return value.map((v) => redactInner(v, undefined, seen));
  }
  const source = value as Record<string | symbol, unknown>;
  const out: Record<string | symbol, unknown> = Object.create(
    Object.getPrototypeOf(value),
  );
  for (const k of Reflect.ownKeys(source)) {
    out[k] = redactInner(source[k], typeof k === "string" ? k : undefined, seen);
  }
  return out;
}
