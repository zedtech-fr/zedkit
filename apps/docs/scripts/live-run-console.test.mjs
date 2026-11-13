import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  fetchLiveRunApi,
  isLiveRunActive,
  isUnchangedLiveRunResult,
  liveRunApiUrl,
  liveRunPollIntervalMs,
  liveRunsApiBase,
  mergeSelectedItem,
  parseLiveRunEnvelope,
  subscribeLiveRun,
  LIVE_RUN_HIDDEN_POLL_MS,
  LIVE_RUN_POLL_MS,
  LIVE_VERSION_HEADER,
} from "../features/reviews/adapters/live-run-api.ts";
import { liveServiceName } from "../features/reviews/adapters/runs-api.ts";
import {
  LIVE_CONSOLE_PATH,
  parseLiveConsoleLocation,
  toLiveConsoleHref,
  writeConsoleShareSearch,
  writeLiveConsoleSearch,
} from "../features/reviews/model/live-console-href.ts";
import { applyLiveRunResult, readyFromLive } from "../features/reviews/model/live-run-poll.ts";
import { toAgentConsole } from "../features/reviews/model/to-agent-console.ts";

const here = dirname(fileURLToPath(import.meta.url));
const reviewsRoot = join(here, "../features/reviews");

function runInfo(overrides = {}) {
  return {
    run_id: "20261113T145002Z-45319b18",
    pr: 388,
    sha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    status: "completed",
    engine: "test",
    engine_label: "test engine",
    created_at: 1_794_581_402,
    server_now: 1_794_582_812,
    elapsed_s: 651,
    verdict: "COMMENT",
    confidence_score: 6,
    review_size: "full",
    ...overrides,
  };
}

function item(overrides = {}) {
  return {
    id: "main",
    name: "Main flow",
    kind: "main",
    engine: "test",
    engine_label: "test",
    model: "test-model",
    status: "completed",
    tool_count: 2,
    message_count: 1,
    tokens_in: 10,
    tokens_out: 4,
    dropped: 0,
    duration_s: 12,
    started_ms: 1_794_581_402_000,
    ended_ms: 1_794_582_053_000,
    last_activity_ms: 1_794_582_053_000,
    last_activity: "done",
    ...overrides,
  };
}

function envelope(overrides = {}) {
  return {
    run: runInfo(),
    items: [item()],
    selected: item({
      entries: [
        { type: "message", ts: 1, text: "hello" },
        {
          type: "tool",
          ts: 2,
          id: "t1",
          tool: "read",
          label: "Read file",
          args: { path: "README.md" },
          status: "done",
          output: "ok",
          output_chars: 2,
        },
        { type: "reasoning", ts: 3, text: "thinking" },
      ],
      final_text: "secret final",
    }),
    verdict_json: { verdict: "COMMENT", notes: [] },
    decision: {
      posted: true,
      must: [],
      notes: [{ text: "A note" }],
      dismissed: [],
      degraded: false,
      enforcement_reasons: [],
      verdict: "COMMENT",
      confidence_score: 6,
    },
    related: [
      {
        run_id: "20261113T150512Z-f630cbf5",
        mode: "live",
        status: "running",
        sha: "14daae1",
        created_at: 1_794_582_312,
        verdict: null,
        confidence_score: null,
        engine_label: null,
        duration_s: null,
      },
    ],
    extra_unknown: true,
    ...overrides,
  };
}

test("toLiveConsoleHref is the in-site console and never a token query", () => {
  assert.equal(toLiveConsoleHref("run-1"), `${LIVE_CONSOLE_PATH}?id=run-1`);
  assert.equal(toLiveConsoleHref("run-1", "main"), `${LIVE_CONSOLE_PATH}?id=run-1&item=main`);
  assert.equal(toLiveConsoleHref(".."), LIVE_CONSOLE_PATH);
  assert.doesNotMatch(toLiveConsoleHref("run-1", "main"), /[?&]t=/);
});

test("parseLiveConsoleLocation reads id, item, and hash item", () => {
  assert.deepEqual(parseLiveConsoleLocation("?id=run-1"), {
    runId: "run-1",
    itemId: null,
    reason: "ok",
  });
  assert.deepEqual(parseLiveConsoleLocation("?id=run-1&item=main"), {
    runId: "run-1",
    itemId: "main",
    reason: "ok",
  });
  assert.deepEqual(parseLiveConsoleLocation("?id=run-1", "#item=lens-1"), {
    runId: "run-1",
    itemId: "lens-1",
    reason: "ok",
  });
  assert.equal(parseLiveConsoleLocation("?id=run-1&item=main", "#item=other").itemId, "main");
  assert.equal(parseLiveConsoleLocation("", "", "run-1").runId, "run-1");
  assert.deepEqual(parseLiveConsoleLocation("?item=lens-1", "", "run-1"), {
    runId: "run-1",
    itemId: "lens-1",
    reason: "ok",
  });
  assert.equal(parseLiveConsoleLocation("").reason, "missing-id");
  assert.equal(parseLiveConsoleLocation("?id=..").reason, "invalid-id");
  assert.equal(parseLiveConsoleLocation("?id=run-1&item=" + "x".repeat(81)).itemId, null);
});

test("writeLiveConsoleSearch keeps appearance pins and drops t", () => {
  const search = writeLiveConsoleSearch({
    search: "?identity=volt&t=secret&preview=dark&id=old",
    runId: "run-2",
    itemId: "main",
  });
  assert.match(search, /id=run-2/);
  assert.match(search, /item=main/);
  assert.match(search, /identity=volt/);
  assert.match(search, /preview=dark/);
  assert.doesNotMatch(search, /[?&]t=/);
});

test("writeConsoleShareSearch keeps id and item when appearance changes", () => {
  const search = writeConsoleShareSearch({
    appearanceSearch: "identity=volt&preview=dark",
    currentSearch: "?id=run-1&item=main&identity=glass",
    pathname: "/issues/run",
  });
  assert.match(search, /id=run-1/);
  assert.match(search, /item=main/);
  assert.match(search, /identity=volt/);
  assert.match(search, /preview=dark/);
  assert.doesNotMatch(search, /identity=glass/);
  const baked = writeConsoleShareSearch({
    appearanceSearch: "identity=volt",
    currentSearch: "?item=lens-1",
    pathname: "/issues/108/runs/run-1",
  });
  assert.match(baked, /item=lens-1/);
  assert.match(baked, /identity=volt/);
  assert.doesNotMatch(baked, /[?&]id=/);
});

test("liveRunApiUrl uses the assembled service path and never a token", () => {
  const url = liveRunApiUrl("https://dev.zedkit.app", "run-1", { item: "main", version: "abc" });
  assert.equal(
    url,
    `https://dev.zedkit.app/${liveServiceName()}/live/run-1/api/run?item=main&v=abc`,
  );
  assert.doesNotMatch(url, /[?&]t=/);
  assert.equal(liveRunApiUrl("https://dev.zedkit.app", ".."), null);
  assert.doesNotMatch(readFileSync(join(reviewsRoot, "adapters/live-run-api.ts"), "utf8"), /t=/);
});

test("liveRunsApiBase prefers the env origin and defaults to the hosted origin", () => {
  const name = ["NEXT_PUBLIC_", ["ZE", "DOS"].join(""), "_RUNS_API_BASE"].join("");
  assert.equal(liveRunsApiBase({ [name]: "https://example.com/runs/" }), "https://example.com/runs");
  assert.equal(liveRunsApiBase({}), "https://dev.zedkit.app");
  assert.match(
    readFileSync(join(reviewsRoot, "adapters/runs-api.ts"), "utf8"),
    /export function runsApiBaseEnvName/,
  );
  assert.doesNotMatch(
    readFileSync(join(reviewsRoot, "adapters/live.ts"), "utf8"),
    /function runsApiBaseEnvName/,
  );
  assert.doesNotMatch(
    readFileSync(join(reviewsRoot, "adapters/live-run-api.ts"), "utf8"),
    /function runsApiBaseEnvName/,
  );
});

test("poll interval is slower when the tab is hidden", () => {
  assert.equal(liveRunPollIntervalMs(false), LIVE_RUN_POLL_MS);
  assert.equal(liveRunPollIntervalMs(true), LIVE_RUN_HIDDEN_POLL_MS);
  assert.equal(isLiveRunActive("running"), true);
  assert.equal(isLiveRunActive("starting"), true);
  assert.equal(isLiveRunActive("Running"), true);
  assert.equal(isLiveRunActive(" STARTING "), true);
  assert.equal(isLiveRunActive("completed"), false);
  assert.equal(isLiveRunActive("failed"), false);
});

test("parseLiveRunEnvelope merges selected entries and omits prompt", () => {
  const parsed = parseLiveRunEnvelope(envelope());
  assert.equal(parsed.ok, true);
  const live = parsed.value;
  assert.equal(live.visibility, "public");
  assert.equal(live.items[0].entries.length, 3);
  assert.equal(live.items[0].entries[1].kind === undefined, true);
  assert.equal(live.items[0].prompt, "");
  assert.equal("prompt" in envelope().selected, false);
  const mapped = toAgentConsole(live);
  const blob = JSON.stringify(mapped);
  assert.doesNotMatch(blob, /secret final/);
  assert.equal(mapped.items[0].entries[1].kind, "tool");
  assert.equal(mapped.items[0].entries[1].name, "Read file");
  assert.equal(mapped.run.confidence, 6);
});

test("parseLiveRunEnvelope accepts a ticket run and null decision", () => {
  const parsed = parseLiveRunEnvelope(
    envelope({
      run: runInfo({
        kind: "ticket",
        target_label: "Issue #386",
        branch: "agent/issue-386",
        opened_pr_url: "https://github.com/zedtech-fr/zedkit/pull/387",
        issue_title: "List steps newest first",
        review_size: null,
        mode: "implement",
      }),
      decision: null,
      verdict_json: null,
      selected: null,
    }),
  );
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value.run.kind, "ticket");
  assert.equal(parsed.value.decision, null);
  assert.equal(parsed.value.items[0].entries.length, 0);
});

test("parseLiveRunEnvelope fails closed on a missing run", () => {
  const parsed = parseLiveRunEnvelope({ items: [], selected: null, decision: null, related: [] });
  assert.equal(parsed.ok, false);
});

test("parseLiveRunEnvelope drops a malformed item and keeps the rest", () => {
  const parsed = parseLiveRunEnvelope(
    envelope({
      items: [item(), { id: "bad" }, item({ id: "lens-1", name: "Lens" })],
      selected: { nope: true },
    }),
  );
  assert.equal(parsed.ok, true);
  assert.deepEqual(
    parsed.value.items.map((row) => row.id),
    ["main", "lens-1"],
  );
});

test("applyLiveRunResult keeps a baked snapshot on 404 and error", () => {
  const parsed = parseLiveRunEnvelope(envelope());
  assert.equal(parsed.ok, true);
  const ready = readyFromLive(parsed.value);
  assert.equal(applyLiveRunResult({ kind: "not-found" }, ready).kind, "ready");
  assert.equal(applyLiveRunResult({ kind: "error", error: new Error("x"), retryable: true }, ready).kind, "ready");
  assert.equal(applyLiveRunResult({ kind: "unauthorized" }, ready).kind, "unauthorized");
  assert.equal(applyLiveRunResult({ kind: "not-found" }, { kind: "loading" }).kind, "not-found");
});

test("mergeSelectedItem replaces the matching summary or prepends", () => {
  const summary = item({ id: "main", entries: [] });
  const lens = item({ id: "lens-1", name: "Lens" });
  const selected = item({
    id: "lens-1",
    name: "Lens",
    entries: [{ type: "message", text: "hi" }],
  });
  const merged = mergeSelectedItem([summary, lens], selected);
  assert.equal(merged[1].entries.length, 1);
  const extra = mergeSelectedItem([summary], item({ id: "new", name: "New", entries: [] }));
  assert.equal(extra[0].id, "new");
});

function headers(map) {
  return new globalThis.Headers(map);
}

test("fetchLiveRunApi maps 200 JSON, 204 version, 401, 404, and 500", async () => {
  const calls = [];
  const payload = envelope();
  const fetchImpl = async (input, init) => {
    calls.push({ url: String(input), init });
    const url = String(input);
    if (url.includes("v=abc")) {
      return new Response(null, { status: 204, headers: headers({ [LIVE_VERSION_HEADER]: "abc" }) });
    }
    if (url.includes("private-run")) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
    }
    if (url.includes("missing-run")) {
      return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
    }
    if (url.includes("broken-run")) {
      return new Response("nope", { status: 500 });
    }
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: headers({ [LIVE_VERSION_HEADER]: "abc", "Cache-Control": "no-store" }),
    });
  };

  const okResult = await fetchLiveRunApi({
    runId: "20261113T145002Z-45319b18",
    itemId: "main",
    fetch: fetchImpl,
    base: "https://dev.zedkit.app",
  });
  assert.equal(okResult.kind, "ok");
  assert.equal(okResult.version, "abc");
  assert.equal(okResult.live.items[0].id, "main");
  assert.equal(calls[0].init.credentials, "omit");
  assert.equal(calls[0].init.cache, "no-store");
  assert.doesNotMatch(calls[0].url, /[?&]t=/);
  assert.match(calls[0].url, /item=main/);

  const unchanged = await fetchLiveRunApi({
    runId: "20261113T145002Z-45319b18",
    version: "abc",
    fetch: fetchImpl,
    base: "https://dev.zedkit.app",
  });
  assert.equal(unchanged.kind, "not-modified");
  assert.equal(unchanged.version, "abc");
  assert.equal(isUnchangedLiveRunResult(okResult, unchanged), true);

  const unauthorized = await fetchLiveRunApi({
    runId: "private-run",
    fetch: fetchImpl,
    base: "https://dev.zedkit.app",
  });
  assert.equal(unauthorized.kind, "unauthorized");

  const missing = await fetchLiveRunApi({
    runId: "missing-run",
    fetch: fetchImpl,
    base: "https://dev.zedkit.app",
  });
  assert.equal(missing.kind, "not-found");

  const broken = await fetchLiveRunApi({
    runId: "broken-run",
    fetch: fetchImpl,
    base: "https://dev.zedkit.app",
  });
  assert.equal(broken.kind, "error");
  assert.equal(broken.retryable, true);
});

test("subscribeLiveRun sends v= after the first version and skips 204 emits", async () => {
  const calls = [];
  const payload = envelope({ run: runInfo({ status: "running" }) });
  let n = 0;
  const fetchImpl = async (input) => {
    calls.push(String(input));
    n += 1;
    if (n === 1) {
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: headers({ [LIVE_VERSION_HEADER]: "v1" }),
      });
    }
    if (n === 2) {
      return new Response(null, {
        status: 204,
        headers: headers({ [LIVE_VERSION_HEADER]: "v1" }),
      });
    }
    return new Response(JSON.stringify(envelope({ run: runInfo({ status: "completed" }) })), {
      status: 200,
      headers: headers({ [LIVE_VERSION_HEADER]: "v2" }),
    });
  };
  const kinds = [];
  await Promise.race([
    new Promise((resolve) => {
      const stop = subscribeLiveRun({
        runId: "20261113T145002Z-45319b18",
        intervalMs: 15,
        base: "https://dev.zedkit.app",
        fetch: fetchImpl,
        onResult: (result) => {
          kinds.push(result.kind);
          if (result.kind === "ok" && result.live.run.status === "completed") {
            stop();
            resolve(undefined);
          }
        },
      });
    }),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("subscribeLiveRun timed out")), 1000);
    }),
  ]);
  assert.deepEqual(kinds, ["ok", "ok"]);
  assert.match(calls[0] ?? "", /\/api\/run$/);
  assert.match(calls[1] ?? "", /[?&]v=v1/);
  assert.ok(calls.every((url) => !/[?&]t=/.test(url)));
});

test("fetchLiveRunApi rejects an invalid run id before fetch", async () => {
  let called = false;
  const result = await fetchLiveRunApi({
    runId: "..",
    fetch: async () => {
      called = true;
      return new Response("{}", { status: 200 });
    },
  });
  assert.equal(result.kind, "invalid");
  assert.equal(called, false);
});

test("live console UI uses kit states and does not duplicate AgentConsole", () => {
  const view = readFileSync(join(reviewsRoot, "ui/review-live-console.tsx"), "utf8");
  const compose = readFileSync(join(reviewsRoot, "compose.tsx"), "utf8");
  const adapter = readFileSync(join(reviewsRoot, "adapters/live-run-api.ts"), "utf8");
  assert.match(view, /AgentConsole|ReviewConsoleView/);
  const states = readFileSync(join(reviewsRoot, "ui/review-live-console-states.tsx"), "utf8");
  assert.match(states, /ErrorState/);
  assert.match(states, /DetailPanelSkeleton/);
  assert.match(view, /LivePulse/);
  assert.match(view, /UpdatedAgo/);
  assert.match(view, /liveConsoleCopy\.unauthorized/);
  assert.match(view, /parseLiveConsoleLocation\(/);
  assert.match(view, /window\.location\.search/);
  assert.match(view, /addEventListener\("popstate"/);
  assert.match(view, /addEventListener\("hashchange"/);
  assert.match(view, /live\.status\.kind === "invalid"/);
  assert.match(view, /liveConsoleCopy\.error/);
  assert.match(states, /liveConsoleCopy\.retry/);
  assert.match(view, /subscribe/);
  assert.match(compose, /subscribeLiveRun/);
  assert.doesNotMatch(view, /<div/);
  assert.doesNotMatch(adapter, /credentials:\s*["']include["']/);
  assert.match(adapter, /credentials:\s*["']omit["']/);
  assert.match(adapter, /pollingSource/);
});
