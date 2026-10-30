import { createServer } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { mergePatch } from "./tokens.mjs";

const MAX_BODY = 8192;
const MAX_PROMPT = 500;
const RATE_PER_MIN = 10;
const RATE_PER_DAY = 100;
const GLOBAL_DAY = 500;
// shortcut: reasoning origins often exceed 30s; drop when the origin streams
const TIMEOUT_MS = 90_000;
// Output budget covers reasoning plus the JSON answer. Cap is the usual 128k completion limit.
const DEFAULT_MAX_TOKENS = 131_072;
const SYSTEM = `Reply with a JSON object of identity tokens only, no markdown.
Fields: spacing, borderWidth, radius, bodyLeading, headingLeading, headingTracking, labelTracking, fontSans, fontDisplay, light {background, foreground, primary, accent, border}, dark {same keys}, shadowSm, shadowMd.
Colours are HSL channels like "240 10% 3.9%" with no hsl() wrapper. Leading is a number string. Tracking ends with em.
Foreground vs background at least 4.5:1 in light and dark. Accent and border vs background at least 3:1.
A partial object is fine; missing fields stay as the current tokens.`;

function parseJson(text) {
  return Promise.resolve(text)
    .then((raw) => JSON.parse(raw))
    .then((value) => ({ ok: true, value }))
    .catch(() => ({ ok: false, value: null }));
}

function send(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(json),
    "cache-control": "no-store",
  });
  res.end(json);
}

function parseMaxTokens(raw) {
  const n = Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isInteger(n) || n < 1) return DEFAULT_MAX_TOKENS;
  return Math.min(n, DEFAULT_MAX_TOKENS);
}

function reasoningEffort(raw) {
  const effort = String(raw ?? "").trim();
  if (!effort || effort === "minimal") return "";
  return effort;
}

function chatConfig(env, prefix) {
  const base = env[`${prefix}BASE_URL`];
  const key = env[`${prefix}API_KEY`];
  const model = env[`${prefix}MODEL`];
  if (!base || !key || !model) return null;
  return {
    base: String(base).replace(/\/$/, ""),
    key: String(key),
    model: String(model),
    maxTokens: parseMaxTokens(env[`${prefix}MAX_TOKENS`] || env.IDENTITY_AI_MAX_TOKENS),
    effort: reasoningEffort(env[`${prefix}REASONING_EFFORT`]),
  };
}

function chatUrl(base) {
  return base.endsWith("/v1") ? `${base}/chat/completions` : `${base}/v1/chat/completions`;
}

function unwrapContent(content) {
  const trimmed = content.trim();
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fence ? fence[1] : trimmed;
}

function messageText(content) {
  if (typeof content === "string") return unwrapContent(content);
  if (!Array.isArray(content)) return "";
  return unwrapContent(
    content
      .map((part) => (typeof part === "string" ? part : part && typeof part.text === "string" ? part.text : ""))
      .join(""),
  );
}

function createLimit() {
  return { perIp: new Map(), global: { day: "", n: 0 } };
}

function dayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function minuteStamp() {
  return Math.floor(Date.now() / 60_000);
}

function allow(limit, ip) {
  const day = dayStamp();
  if (limit.global.day !== day) {
    limit.global = { day, n: 0 };
    limit.perIp.clear();
  }
  if (limit.global.n >= GLOBAL_DAY) return false;
  let rec = limit.perIp.get(ip);
  if (!rec) {
    rec = { minute: 0, minuteN: 0, day, dayN: 0 };
    limit.perIp.set(ip, rec);
  }
  if (rec.day !== day) {
    rec.day = day;
    rec.dayN = 0;
  }
  const minute = minuteStamp();
  if (rec.minute !== minute) {
    rec.minute = minute;
    rec.minuteN = 0;
  }
  if (rec.minuteN >= RATE_PER_MIN || rec.dayN >= RATE_PER_DAY) return false;
  rec.minuteN += 1;
  rec.dayN += 1;
  limit.global.n += 1;
  return true;
}

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim() || "unknown";
  }
  return req.socket.remoteAddress ?? "unknown";
}

function readBody(req) {
  return new Promise((resolveBody) => {
    const chunks = [];
    let size = 0;
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolveBody(value);
    };
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        req.destroy();
        finish({ tooLarge: true });
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => finish({ text: Buffer.concat(chunks).toString("utf8") }));
    req.on("error", () => finish({ text: null }));
  });
}

function complete(cfg, prompt, current, fetchImpl) {
  return fetchImpl(chatUrl(cfg.base), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${cfg.key}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: cfg.maxTokens,
      ...(cfg.effort ? { reasoning_effort: cfg.effort } : {}),
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: JSON.stringify({ prompt, current }) },
      ],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
    .then((res) => res.text().then((text) => ({ ok: res.ok, status: res.status, text })))
    .then((res) => {
      if (!res.ok) {
        console.error("suggest: upstream", res.status);
        return { status: res.status };
      }
      return parseJson(res.text).then((outer) => {
        if (!outer.ok) return { status: 502 };
        const content = messageText(outer.value?.choices?.[0]?.message?.content);
        if (!content) return { status: 502 };
        return parseJson(content).then((inner) => (inner.ok ? { patch: inner.value } : { status: 502 }));
      });
    })
    .catch((err) => {
      console.error("suggest: upstream", err?.name === "TimeoutError" ? "timeout" : "fetch");
      return { status: 502 };
    });
}

function firstComplete(env, prompt, current, fetchImpl) {
  const configs = [chatConfig(env, "IDENTITY_AI_"), chatConfig(env, "IDENTITY_AI_FALLBACK_")].filter(
    Boolean,
  );
  return configs.reduce(
    (chain, cfg) =>
      chain.then((acc) => {
        if (acc.tokens) return acc;
        return complete(cfg, prompt, current, fetchImpl).then((result) => {
          const tokens = result.patch ? mergePatch(current, result.patch) : null;
          if (tokens) return { tokens };
          const status = result.status === 429 || acc.status === 429 ? 429 : result.status;
          return { status };
        });
      }),
    Promise.resolve({}),
  );
}

async function route(req, res, { env, fetchImpl, limit }) {
  const url = new URL(req.url ?? "/", "http://suggest.local");
  if (url.pathname !== "/api/identity/suggest" && url.pathname !== "/api/identity/suggest/") {
    send(res, 404, { error: "not found" });
    return;
  }
  if (req.method !== "POST") {
    send(res, 405, { error: "method" });
    return;
  }
  if (!chatConfig(env, "IDENTITY_AI_") && !chatConfig(env, "IDENTITY_AI_FALLBACK_")) {
    send(res, 503, { disabled: true });
    return;
  }
  if (!allow(limit, clientIp(req))) {
    send(res, 429, { error: "rate" });
    return;
  }
  const body = await readBody(req);
  if (body.tooLarge) {
    send(res, 413, { error: "size" });
    return;
  }
  const parsed = await parseJson(body.text ?? "");
  const prompt = parsed.ok && typeof parsed.value?.prompt === "string" ? parsed.value.prompt.trim() : "";
  const current = parsed.ok ? parsed.value?.current : null;
  if (!parsed.ok || prompt.length === 0 || prompt.length > MAX_PROMPT || !mergePatch(current, {})) {
    send(res, 400, { error: "body" });
    return;
  }
  const out = await firstComplete(env, prompt, mergePatch(current, {}), fetchImpl);
  if (out.tokens) {
    send(res, 200, { tokens: out.tokens });
    return;
  }
  if (out.status === 429) {
    send(res, 429, { error: "rate" });
    return;
  }
  send(res, 502, { error: "upstream" });
}

function handleSuggest(req, res, deps) {
  return Promise.resolve(route(req, res, deps)).catch(() => {
    if (!res.headersSent) send(res, 500, { error: "internal" });
  });
}

function listenSuggest(options = {}) {
  const env = options.env ?? process.env;
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const limit = options.limit ?? createLimit();
  const host = options.host ?? "127.0.0.1";
  const port = options.port ?? 0;
  const server = createServer((req, res) => {
    void handleSuggest(req, res, { env, fetchImpl, limit });
  });
  return new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      const address = server.address();
      resolveListen({ server, port: address.port });
    });
  });
}

const invoked = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (invoked) {
  listenSuggest({ host: "0.0.0.0", port: Number(process.env.PORT || 3001) }).then(({ port }) => {
    console.log(`suggest: listening on ${port}`);
  });
}

export { createLimit, listenSuggest };
