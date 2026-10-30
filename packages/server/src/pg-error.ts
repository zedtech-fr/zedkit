// Original work by the same author.
/**
 * Reads the Postgres error code (`23505` unique, `23503` FK, ...) from a
 * thrown value. Lets callers decide conflict-vs-bug without each
 * keeping its own shape check.
 */
export function pgErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return null;
  }
  const code = (error as { code: unknown }).code;
  return typeof code === "string" ? code : null;
}

/** SQLSTATE values workers commonly retry (serialization, deadlock, connection blips). */
const PG_RETRYABLE_CODES = new Set([
  "40001",
  "40P01",
  "53300",
  "57P01",
  "08000",
  "08001",
  "08003",
  "08006",
]);

/**
 * Whether a thrown Postgres error is worth retrying. `null` when the value
 * is not a Postgres-shaped error (no string `code`).
 */
export function pgErrorRetryable(error: unknown): boolean | null {
  const code = pgErrorCode(error);
  if (code === null) return null;
  return PG_RETRYABLE_CODES.has(code);
}
