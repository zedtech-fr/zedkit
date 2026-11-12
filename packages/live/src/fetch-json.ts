// Original work by the same author.
import {
  PermanentError,
  TransientError,
  tryCatch,
  tryCatchAsync,
  type Result,
} from "@zedtech/zedkit-core";

export type FetchJsonOptions = RequestInit & {
  /** Injected `fetch`. Default: `globalThis.fetch`. */
  fetch?: typeof globalThis.fetch;
  /** Injected delay. Default: `setTimeout`. */
  sleep?: (ms: number) => Promise<void>;
  /** Per-attempt abort timeout. Default 10_000. */
  timeoutMs?: number;
  /** Extra attempts after the first. Default 2. */
  retries?: number;
  /** Base delay for exponential backoff. Default 250. */
  intervalMs?: number;
  /** Backoff ceiling (also caps `Retry-After`). Default: `intervalMs * 8`. */
  maxBackoffMs?: number;
};

type Attempt =
  | { ok: true; value: unknown }
  | { ok: false; error: Error; retryAfterMs?: number; abortedByCaller: boolean };

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isTransientStatus(status: number): boolean {
  return status >= 500 || status === 408 || status === 403 || status === 429;
}

function httpError(status: number): Error {
  const message = `fetchJson: HTTP ${status}`;
  return isTransientStatus(status) ? new TransientError(message) : new PermanentError(message);
}

function parseRetryAfterMs(header: string | null): number | undefined {
  if (header === null) return undefined;
  const trimmed = header.trim();
  if (!/^\d+$/.test(trimmed)) return undefined;
  return Number(trimmed) * 1000;
}

function backoffMs(failures: number, intervalMs: number, maxBackoffMs: number): number {
  return Math.min(maxBackoffMs, intervalMs * 2 ** failures);
}

async function readBody(response: Response): Promise<Attempt> {
  const body = await tryCatchAsync(() => response.text());
  if (!body.ok) {
    return {
      ok: false,
      error: new TransientError("fetchJson: request failed", { cause: body.error }),
      abortedByCaller: false,
    };
  }
  if (body.value.trim() === "") {
    return { ok: true, value: undefined };
  }
  const parsed = tryCatch(() => JSON.parse(body.value) as unknown);
  if (!parsed.ok) {
    return {
      ok: false,
      error: new PermanentError("fetchJson: malformed JSON", { cause: parsed.error }),
      abortedByCaller: false,
    };
  }
  return { ok: true, value: parsed.value };
}

async function attemptOnce(
  input: RequestInfo | URL,
  requestInit: RequestInit,
  fetchImpl: typeof globalThis.fetch,
  timeoutMs: number,
  callerSignal: AbortSignal | undefined,
): Promise<Attempt> {
  const timeout = AbortSignal.timeout(timeoutMs);
  const signal = callerSignal === undefined ? timeout : AbortSignal.any([callerSignal, timeout]);
  const fetched = await tryCatchAsync(() => fetchImpl(input, { ...requestInit, signal }));
  if (!fetched.ok) {
    if (callerSignal?.aborted) {
      return {
        ok: false,
        error: new TransientError("fetchJson: aborted", { cause: fetched.error }),
        abortedByCaller: true,
      };
    }
    const message = timeout.aborted ? "fetchJson: timeout" : "fetchJson: request failed";
    return {
      ok: false,
      error: new TransientError(message, { cause: fetched.error }),
      abortedByCaller: false,
    };
  }
  if (!fetched.value.ok) {
    const retryAfterMs =
      fetched.value.status === 429 ? parseRetryAfterMs(fetched.value.headers.get("Retry-After")) : undefined;
    if (retryAfterMs === undefined) {
      return { ok: false, error: httpError(fetched.value.status), abortedByCaller: false };
    }
    return {
      ok: false,
      error: httpError(fetched.value.status),
      retryAfterMs,
      abortedByCaller: false,
    };
  }
  return readBody(fetched.value);
}

function delayMs(
  failure: Extract<Attempt, { ok: false }>,
  failures: number,
  intervalMs: number,
  maxBackoffMs: number,
): number {
  if (failure.retryAfterMs !== undefined) {
    return Math.min(failure.retryAfterMs, maxBackoffMs);
  }
  return backoffMs(failures, intervalMs, maxBackoffMs);
}

/**
 * GET JSON with a timeout, retry transient HTTP and network failures, honor
 * `Retry-After` on 429, and return a `Result`. Request header values never
 * appear in `error.message`.
 */
export async function fetchJson(
  input: RequestInfo | URL,
  options?: FetchJsonOptions,
): Promise<Result<unknown, Error>> {
  const {
    fetch: fetchImpl = globalThis.fetch,
    sleep = defaultSleep,
    timeoutMs = 10_000,
    retries = 2,
    intervalMs = 250,
    maxBackoffMs: maxBackoffOption,
    ...requestInit
  } = options ?? {};
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new RangeError("fetchJson: timeoutMs must be a positive number");
  }
  if (!Number.isFinite(retries) || retries < 0) {
    throw new RangeError("fetchJson: retries must be a finite number >= 0");
  }
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
    throw new RangeError("fetchJson: intervalMs must be a positive number");
  }
  const maxBackoffMs = Math.max(maxBackoffOption ?? intervalMs * 8, intervalMs);
  const callerSignal = requestInit.signal ?? undefined;

  let lastError: Error = new TransientError("fetchJson: request failed");
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const outcome = await attemptOnce(input, requestInit, fetchImpl, timeoutMs, callerSignal);
    if (outcome.ok) {
      return { ok: true, value: outcome.value };
    }
    lastError = outcome.error;
    const giveUp =
      outcome.abortedByCaller || !(lastError instanceof TransientError) || attempt === retries;
    if (giveUp) {
      return { ok: false, error: lastError };
    }
    await sleep(delayMs(outcome, attempt + 1, intervalMs, maxBackoffMs));
  }
  return { ok: false, error: lastError };
}
