import { afterEach, describe, expect, it, vi } from "vitest";
import { PermanentError, TransientError } from "@zedtech/zedkit-core";
import { fetchJson } from "../src/index.js";

const url = "https://example.test/api/runs";
const TOKEN = "Bearer test-token-do-not-leak-9f3a";

function jsonResponse(
  body: unknown,
  status = 200,
  headers?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

function textResponse(body: string, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(body, { status, headers });
}

function immediateSleep() {
  return vi.fn<(ms: number) => Promise<void>>(async () => {});
}

const hangUntilAbort: typeof fetch = (_input, init) =>
  new Promise((_resolve, reject) => {
    const signal = init?.signal;
    if (signal == null) {
      return;
    }
    const fail = (): void => {
      const reason = signal.reason;
      reject(reason instanceof Error ? reason : new DOMException("Aborted", "AbortError"));
    };
    if (signal.aborted) {
      fail();
      return;
    }
    signal.addEventListener("abort", fail, { once: true });
  });

describe("fetchJson", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns parsed JSON on 200", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ runs: [] }));
    const result = await fetchJson(url, { fetch: fetchImpl, retries: 0 });
    expect(result).toEqual({ ok: true, value: { runs: [] } });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("returns undefined for an empty 200 body", async () => {
    const fetchImpl = vi.fn(async () => textResponse(""));
    const result = await fetchJson(url, { fetch: fetchImpl, retries: 0 });
    expect(result).toEqual({ ok: true, value: undefined });
  });

  it("treats malformed JSON as permanent and does not retry", async () => {
    const fetchImpl = vi.fn(async () => textResponse("{", 200));
    const sleep = immediateSleep();
    const result = await fetchJson(url, { fetch: fetchImpl, sleep, retries: 2 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(PermanentError);
    expect(result.error.message).toBe("fetchJson: malformed JSON");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("does not retry a 404", async () => {
    const fetchImpl = vi.fn(async () => textResponse("missing", 404));
    const sleep = immediateSleep();
    const result = await fetchJson(url, { fetch: fetchImpl, sleep, retries: 2 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(PermanentError);
    expect(result.error.message).toBe("fetchJson: HTTP 404");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("retries 5xx, then returns the JSON", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(textResponse("down", 503))
      .mockResolvedValueOnce(jsonResponse({ id: 1 }));
    const sleep = immediateSleep();
    const result = await fetchJson(url, {
      fetch: fetchImpl,
      sleep,
      retries: 2,
      intervalMs: 100,
    });
    expect(result).toEqual({ ok: true, value: { id: 1 } });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(sleep).toHaveBeenCalledWith(200);
  });

  it("retries 5xx then fails as transient", async () => {
    const fetchImpl = vi.fn(async () => textResponse("down", 500));
    const sleep = immediateSleep();
    const result = await fetchJson(url, { fetch: fetchImpl, sleep, retries: 2, intervalMs: 100 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(TransientError);
    expect(result.error.message).toBe("fetchJson: HTTP 500");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls.map((call) => call[0])).toEqual([200, 400]);
  });

  it("waits Retry-After seconds on 429, capped at maxBackoffMs", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(textResponse("slow", 429, { "Retry-After": "3" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const sleep = immediateSleep();
    const result = await fetchJson(url, {
      fetch: fetchImpl,
      sleep,
      retries: 2,
      intervalMs: 100,
      maxBackoffMs: 1_500,
    });
    expect(result).toEqual({ ok: true, value: { ok: true } });
    expect(sleep).toHaveBeenCalledWith(1_500);
  });

  it("uses exponential backoff when 429 has no Retry-After", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(textResponse("slow", 429))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const sleep = immediateSleep();
    const result = await fetchJson(url, {
      fetch: fetchImpl,
      sleep,
      retries: 1,
      intervalMs: 100,
    });
    expect(result).toEqual({ ok: true, value: { ok: true } });
    expect(sleep).toHaveBeenCalledWith(200);
  });

  it("ignores a non-numeric Retry-After and uses backoff", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(textResponse("slow", 429, { "Retry-After": "later" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const sleep = immediateSleep();
    const result = await fetchJson(url, {
      fetch: fetchImpl,
      sleep,
      retries: 1,
      intervalMs: 100,
    });
    expect(result).toEqual({ ok: true, value: { ok: true } });
    expect(sleep).toHaveBeenCalledWith(200);
  });

  it("retries 403 then fails as transient", async () => {
    const fetchImpl = vi.fn(async () => textResponse("limited", 403));
    const sleep = immediateSleep();
    const result = await fetchJson(url, { fetch: fetchImpl, sleep, retries: 1, intervalMs: 50 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(TransientError);
    expect(result.error.message).toBe("fetchJson: HTTP 403");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("retries 408 as transient", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(textResponse("timeout", 408))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const sleep = immediateSleep();
    const result = await fetchJson(url, { fetch: fetchImpl, sleep, retries: 1, intervalMs: 50 });
    expect(result).toEqual({ ok: true, value: { ok: true } });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("aborts on timeout and retries as transient", async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn(hangUntilAbort);
    const sleep = immediateSleep();
    const pending = fetchJson(url, {
      fetch: fetchImpl,
      sleep,
      timeoutMs: 25,
      retries: 1,
      intervalMs: 10,
    });
    await vi.advanceTimersByTimeAsync(25);
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(25);
    const result = await pending;
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(TransientError);
    expect(result.error.message).toBe("fetchJson: timeout");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("retries a thrown network error as transient", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    const sleep = immediateSleep();
    const result = await fetchJson(url, { fetch: fetchImpl, sleep, retries: 1, intervalMs: 50 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(TransientError);
    expect(result.error.message).toBe("fetchJson: request failed");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("forwards Authorization and never puts it in error messages", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => textResponse("nope", 500));
    const sleep = immediateSleep();
    const result = await fetchJson(url, {
      fetch: fetchImpl,
      sleep,
      retries: 0,
      headers: { Authorization: TOKEN },
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      url,
      expect.objectContaining({ headers: { Authorization: TOKEN } }),
    );
    const init = fetchImpl.mock.calls[0]?.[1];
    expect(init).not.toHaveProperty("fetch");
    expect(init).not.toHaveProperty("sleep");
    expect(init).not.toHaveProperty("retries");
    expect(init).not.toHaveProperty("timeoutMs");
    expect(init).not.toHaveProperty("intervalMs");
    expect(init).not.toHaveProperty("maxBackoffMs");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    const serialized = `${result.error.message}\n${result.error.stack ?? ""}\n${JSON.stringify(result)}`;
    expect(serialized).not.toContain(TOKEN);
    expect(serialized).not.toContain("test-token-do-not-leak-9f3a");
  });
});
