import assert from "node:assert/strict";
import test from "node:test";

import { listenSuggest } from "./server.mjs";
import { mergePatch } from "./tokens.mjs";

const CURRENT = {
  spacing: "0.25rem",
  borderWidth: "1px",
  radius: "0.5rem",
  bodyLeading: "1.6",
  headingLeading: "1.1",
  headingTracking: "-0.025em",
  labelTracking: "0.025em",
  fontSans: "Inter, sans-serif",
  fontDisplay: "Inter, sans-serif",
  light: {
    background: "0 0% 100%",
    foreground: "240 10% 3.9%",
    primary: "240 5.9% 10%",
    accent: "240 4.8% 95.9%",
    border: "240 5.9% 90%",
  },
  dark: {
    background: "240 10% 3.9%",
    foreground: "0 0% 98%",
    primary: "0 0% 98%",
    accent: "240 3.7% 15.9%",
    border: "240 3.7% 15.9%",
  },
  shadowSm: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
  shadowMd: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
};

const ENV = {
  IDENTITY_AI_BASE_URL: "https://primary.test",
  IDENTITY_AI_API_KEY: "test-primary",
  IDENTITY_AI_MODEL: "primary-model",
};

const FALLBACK_ENV = {
  ...ENV,
  IDENTITY_AI_FALLBACK_BASE_URL: "https://fallback.test",
  IDENTITY_AI_FALLBACK_API_KEY: "test-fallback",
  IDENTITY_AI_FALLBACK_MODEL: "fallback-model",
};

function chatReply(patch, { ok = true } = {}) {
  return {
    ok,
    status: ok ? 200 : 500,
    text: () =>
      Promise.resolve(
        JSON.stringify({ choices: [{ message: { content: JSON.stringify(patch) } }] }),
      ),
  };
}

function post(port, body) {
  return fetch(`http://127.0.0.1:${port}/api/identity/suggest`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function withServer(options, fn) {
  const { server, port } = await listenSuggest({ port: 0, host: "127.0.0.1", ...options });
  return Promise.resolve()
    .then(() => fn(port))
    .finally(
      () =>
        new Promise((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        }),
    );
}

test("mergePatch keeps current fields and applies a spacing patch", () => {
  const merged = mergePatch(CURRENT, { spacing: "0.4rem" });
  assert.equal(merged.spacing, "0.4rem");
  assert.equal(merged.radius, "0.5rem");
  assert.equal(merged.light.foreground, "240 10% 3.9%");
});

test("mergePatch rejects a bad colour", () => {
  assert.equal(mergePatch(CURRENT, { light: { foreground: "red" } }), null);
});

test("POST without env returns 503 disabled", async () => {
  await withServer({ env: {} }, async (port) => {
    const res = await post(port, { prompt: "warmer", current: CURRENT });
    assert.equal(res.status, 503);
    assert.deepEqual(await res.json(), { disabled: true });
  });
});

test("POST asks the model for AA contrast in the system message", async () => {
  let system = "";
  let payload = {};
  const fetchImpl = (_url, init) => {
    payload = JSON.parse(String(init.body));
    system = payload.messages.find((row) => row.role === "system")?.content ?? "";
    return Promise.resolve(chatReply({ spacing: "0.4rem" }));
  };
  await withServer({ env: ENV, fetchImpl }, async (port) => {
    const res = await post(port, { prompt: "more space", current: CURRENT });
    assert.equal(res.status, 200);
    assert.match(system, /4\.5:1/);
    assert.match(system, /3:1/);
    assert.equal("response_format" in payload, false);
    assert.equal("temperature" in payload, false);
  });
});

test("POST reads chat content from a text-part array", async () => {
  const fetchImpl = () =>
    Promise.resolve({
      ok: true,
      status: 200,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            choices: [{ message: { content: [{ type: "text", text: JSON.stringify({ spacing: "0.4rem" }) }] } }],
          }),
        ),
    });
  await withServer({ env: ENV, fetchImpl }, async (port) => {
    const res = await post(port, { prompt: "more space", current: CURRENT });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).tokens.spacing, "0.4rem");
  });
});

test("POST merges a mocked chat patch onto current tokens", async () => {
  const fetchImpl = (url) => {
    assert.match(url, /https:\/\/primary\.test\/v1\/chat\/completions/);
    return Promise.resolve(chatReply({ spacing: "0.4rem" }));
  };
  await withServer({ env: ENV, fetchImpl }, async (port) => {
    const res = await post(port, { prompt: "more space", current: CURRENT });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.tokens.spacing, "0.4rem");
    assert.equal(body.tokens.radius, "0.5rem");
    assert.equal(body.tokens.light.background, "0 0% 100%");
  });
});

test("POST returns 429 when the chat origin is rate-limited", async () => {
  const fetchImpl = () => Promise.resolve({ ok: false, status: 429, text: () => Promise.resolve("{}") });
  await withServer({ env: ENV, fetchImpl }, async (port) => {
    const res = await post(port, { prompt: "warmer", current: CURRENT });
    assert.equal(res.status, 429);
    assert.deepEqual(await res.json(), { error: "rate" });
  });
});

test("POST uses fallback when primary is rate-limited", async () => {
  const seen = [];
  const fetchImpl = (url) => {
    seen.push(url);
    if (new URL(url).hostname === "primary.test") {
      return Promise.resolve({ ok: false, status: 429, text: () => Promise.resolve("{}") });
    }
    return Promise.resolve(chatReply({ radius: "1rem" }));
  };
  await withServer({ env: FALLBACK_ENV, fetchImpl }, async (port) => {
    const res = await post(port, { prompt: "rounder", current: CURRENT });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).tokens.radius, "1rem");
    assert.equal(seen.length, 2);
  });
});

test("POST uses fallback when primary fails", async () => {
  const seen = [];
  const fetchImpl = (url) => {
    seen.push(url);
    if (new URL(url).hostname === "primary.test") {
      return Promise.resolve({ ok: false, status: 500, text: () => Promise.resolve("{}") });
    }
    return Promise.resolve(chatReply({ radius: "1rem" }));
  };
  await withServer({ env: FALLBACK_ENV, fetchImpl }, async (port) => {
    const res = await post(port, { prompt: "rounder", current: CURRENT });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).tokens.radius, "1rem");
    assert.equal(seen.length, 2);
    assert.match(seen[1], /https:\/\/fallback\.test\/v1\/chat\/completions/);
  });
});

test("POST returns 502 when the upstream fetch is aborted", async () => {
  const fetchImpl = () => {
    const err = new Error("The operation was aborted.");
    err.name = "TimeoutError";
    return Promise.reject(err);
  };
  await withServer({ env: ENV, fetchImpl }, async (port) => {
    const res = await post(port, { prompt: "warm", current: CURRENT });
    assert.equal(res.status, 502);
    assert.equal((await res.json()).error, "upstream");
  });
});

test("POST returns 502 when the model output fails the token schema", async () => {
  const fetchImpl = () => Promise.resolve(chatReply({ spacing: "" }));
  await withServer({ env: ENV, fetchImpl }, async (port) => {
    const res = await post(port, { prompt: "broken", current: CURRENT });
    assert.equal(res.status, 502);
  });
});

test("POST returns 400 when the prompt is too long", async () => {
  const fetchImpl = () => Promise.reject(new Error("upstream should not run"));
  await withServer({ env: ENV, fetchImpl }, async (port) => {
    const res = await post(port, { prompt: "x".repeat(501), current: CURRENT });
    assert.equal(res.status, 400);
  });
});

test("POST returns 429 after the per-IP minute cap", async () => {
  const fetchImpl = () => Promise.resolve(chatReply({}));
  await withServer({ env: ENV, fetchImpl }, async (port) => {
    for (let i = 0; i < 10; i += 1) {
      const res = await post(port, { prompt: `ok ${i}`, current: CURRENT });
      assert.equal(res.status, 200);
    }
    const limited = await post(port, { prompt: "one more", current: CURRENT });
    assert.equal(limited.status, 429);
  });
});

test("GET is 405", async () => {
  await withServer({ env: ENV, fetchImpl: () => Promise.resolve(chatReply({})) }, async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/identity/suggest`);
    assert.equal(res.status, 405);
  });
});

test("POST uses a high max_tokens default and skips minimal reasoning_effort", async () => {
  const bodies = [];
  const fetchImpl = (_url, init) => {
    bodies.push(JSON.parse(init.body));
    return Promise.resolve(chatReply({ spacing: "0.4rem" }));
  };
  await withServer({ env: ENV, fetchImpl }, async (port) => {
    const res = await post(port, { prompt: "more space", current: CURRENT });
    assert.equal(res.status, 200);
  });
  await withServer(
    { env: { ...ENV, IDENTITY_AI_REASONING_EFFORT: "minimal", IDENTITY_AI_MAX_TOKENS: "32000" }, fetchImpl },
    async (port) => {
      const res = await post(port, { prompt: "more space", current: CURRENT });
      assert.equal(res.status, 200);
    },
  );
  await withServer({ env: { ...ENV, IDENTITY_AI_REASONING_EFFORT: "high" }, fetchImpl }, async (port) => {
    const res = await post(port, { prompt: "more space", current: CURRENT });
    assert.equal(res.status, 200);
  });
  assert.equal(bodies[0].max_tokens, 131072);
  assert.equal("reasoning_effort" in bodies[0], false);
  assert.equal(bodies[1].max_tokens, 32000);
  assert.equal("reasoning_effort" in bodies[1], false);
  assert.equal(bodies[2].reasoning_effort, "high");
});
