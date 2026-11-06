// Original work by the same author.
// This file is the ONE documented exception to the TryStatement lint ban:
// it implements the wrappers everything else must use.
import { err, ok, type Result } from "./result.js";

export function normalizeThrown(thrown: unknown): Error {
  if (thrown instanceof Error) {
    return thrown;
  }
  const message = typeof thrown === "string" ? thrown : String(thrown);
  const wrapped = new Error(message);
  wrapped.cause = thrown;
  return wrapped;
}

export function tryCatch<T>(fn: () => T): Result<T, Error> {
  try {
    return ok(fn());
  } catch (thrown) {
    return err(normalizeThrown(thrown));
  }
}

export function tryCatchAsync<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
  return Promise.resolve()
    .then(() => fn())
    .then((value) => ok(value))
    .catch((thrown) => err(normalizeThrown(thrown)));
}
