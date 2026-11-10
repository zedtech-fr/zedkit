import type { ReviewRecord } from "../ports/review-port";

const SECRET_KEY_PATTERN =
  /(api[_-]?key|secret|token|password|passwd|signature|authorization|cookie|set-cookie|private[_-]?key|credentials)/i;
const AUTH_TOKEN_PATTERN = /\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi;
const HOME_PATH_PATTERN = /(?:\/(?:home|Users)\/\S+|(?:[A-Za-z]:)?\\Users\\\S+)/g;

function scrubString(value: string): string {
  return value
    .replace(AUTH_TOKEN_PATTERN, (match) => `${match.split(/\s/, 1)[0]} [redacted]`)
    .replace(HOME_PATH_PATTERN, "[path]");
}

function scrub(value: unknown, key?: string): unknown {
  if (key !== undefined && SECRET_KEY_PATTERN.test(key)) return "[redacted]";
  if (typeof value === "string") return scrubString(value);
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => scrub(item));
  const out: Record<string, unknown> = {};
  for (const [entryKey, entryValue] of Object.entries(value)) {
    out[entryKey] = scrub(entryValue, entryKey);
  }
  return out;
}

/** Public reviews only; secret-like keys, tokens, and home paths are scrubbed. */
export function toPublicReviews(records: readonly ReviewRecord[]): ReviewRecord[] {
  return records
    .filter((record) => record.visibility === "public")
    .map((record) => scrub(structuredClone(record)) as ReviewRecord);
}
