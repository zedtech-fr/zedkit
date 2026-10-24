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
