import type { PublicLiveRun } from "../ports/review-port";

const SECRET_KEY_PATTERN =
  /(api[_-]?key|secret|token|password|passwd|signature|authorization|cookie|set-cookie|private[_-]?key|credentials)/i;
const AUTH_TOKEN_PATTERN = /\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi;
const HOME_PATH_PATTERN = /(?:\/(?:home|Users)\/\S+|(?:[A-Za-z]:)?\\Users\\\S+)/g;
const UNSAFE_PATH_PATTERN = /\/home\/|\/Users\/|\\Users\\/;
const UNSAFE_TOKEN_PATTERN = /\b(?:Bearer|Basic)\s+(?!\[redacted\])[A-Za-z0-9._~+/=-]+/;

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

/** Fail closed if a public payload still contains a home path or auth token. */
export function assertPubliclySafe(value: unknown): void {
  const text = JSON.stringify(value);
  if (UNSAFE_PATH_PATTERN.test(text) || UNSAFE_TOKEN_PATTERN.test(text)) {
    throw new Error("public review snapshot: unredacted token or machine path");
  }
}

/** Public live runs only; secret-like keys, tokens, and home paths are scrubbed. */
export function toPublicReviews(records: readonly PublicLiveRun[]): PublicLiveRun[] {
  const publicRows = records.filter((record) => record.visibility === "public");
  const scrubbed = publicRows.map((record) => scrub(structuredClone(record)) as PublicLiveRun);
  assertPubliclySafe(scrubbed);
  return scrubbed;
}
