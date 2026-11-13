import assert from "node:assert/strict";
import test from "node:test";

import {
  activeRunsUrl,
  fetchActiveHeroRun,
  followRunHref,
  heroRunTitle,
  heroStepLabel,
  liveUpdateMessage,
  nextLivePollMs,
  parseActiveRunsEnvelope,
  resolveRunsApiBase,
  sanitizeHeroLiveUrl,
  selectActiveHeroRun,
  startHeroLivePoll,
  ACTIVE_HERO_POLL_MS,
} from "./home-hero-active-run.ts";
import { homeHeroCopy } from "./i18n/home-hero-copy.ts";

const copy = homeHeroCopy.heroIllustration;
const TITLE = { issueFallback: copy.issueFallback, prFallback: copy.prFallback, untitled: copy.untitled };

function serviceName() {
  return [["ze", "dos"].join(""), "bot"].join("-");
}

function hostedLive(runId = "20261113T120000Z-hero1") {
  return `https://dev.zedkit.app/${serviceName()}/live/${runId}`;
}

function step(key, status, summary = null) {
  const labels = { plan: "Plan", build: "Build", check: "Check", fix: "Fix", done: "Done" };
  return {
    key,
    label: labels[key],
    status,
    summary,
    runId: "20261113T120000Z-hero1",
    liveUrl: null,
    startedAt: status === "pending" || status === "skipped" ? null : "2026-11-13T12:00:00Z",
    endedAt: status === "done" || status === "failed" ? "2026-11-13T12:01:00Z" : null,
  };
}

function steps(active = "build") {
  const order = ["plan", "build", "check", "fix", "done"];
  return order.map((key) => {
    if (key === active) return step(key, "active", `${key} is underway`);
    const idx = order.indexOf(key);
    const activeIdx = order.indexOf(active);
    if (idx < activeIdx) return step(key, "done", `${key} finished`);
    return step(key, "pending", null);
  });
}

function runRow(overrides = {}) {
  return {
    runId: "20261113T120000Z-hero1",
    issue: 241,
    pr: 250,
    kind: "implement",
    phase: "build",
    status: "running",
    startedAt: "2026-11-13T12:00:00Z",
    endedAt: null,
    durationMs: 12_000,
    models: [],
    verdict: null,
    score: null,
    superseded: false,
    liveUrl: null,
    title: "Add an empty state to the tasks list",
    titleSource: "issue",
    githubUrl: "https://github.com/zedtech-fr/zedkit/issues/241",
    active: true,
    stale: false,
    step: "build",
    steps: steps("build"),
    ...overrides,
  };
}

function envelope(runs, extra = {}) {
  return {
    version: 1,
    generatedAt: "2026-11-13T12:00:00Z",
    nextCursor: null,
    runs,
    ...extra,
  };
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("env origin wins over the browser hostname fallback", () => {
  assert.equal(
    resolveRunsApiBase({ envValue: "https://example.test/runs/", hostname: "zedkit.app" }),
    "https://example.test",
  );
  assert.equal(resolveRunsApiBase({ envValue: "not a url", hostname: "zedkit.app" }), "https://dev.zedkit.app");
  assert.equal(resolveRunsApiBase({ envValue: "http://dev.zedkit.app", hostname: "zedkit.app" }), "https://dev.zedkit.app");
});

test("browser origins fall back to the staging runs origin", () => {
  for (const hostname of ["zedkit.app", "dev.zedkit.app", "epic-73.dev.zedkit.app"]) {
    assert.equal(resolveRunsApiBase({ hostname }), "https://dev.zedkit.app", hostname);
  }
  assert.equal(resolveRunsApiBase({ hostname: "127.0.0.1" }), null);
  assert.equal(resolveRunsApiBase({ hostname: "localhost" }), null);
  assert.equal(resolveRunsApiBase({}), null);
});

test("active runs URL uses the assembled service path", () => {
  const url = activeRunsUrl("https://dev.zedkit.app/");
  assert.equal(url, `https://dev.zedkit.app/${serviceName()}/api/runs?active=1&limit=1`);
});

test("maps an active run title, steps, and CTA hrefs", () => {
  const parsed = parseActiveRunsEnvelope(envelope([runRow()]));
  assert.equal(parsed.ok, true);
  const run = selectActiveHeroRun(parsed.value);
  assert.ok(run);
  assert.equal(heroRunTitle(run, TITLE), "Add an empty state to the tasks list");
  assert.equal(run.steps.length, 5);
  assert.equal(run.steps[1]?.status, "active");
  assert.equal(run.steps[1]?.summary, "build is underway");
  assert.deepEqual(followRunHref(run), { href: "/issues#issue-241", offPath: false });
  assert.equal(copy.followRunNamed(heroRunTitle(run, TITLE)), "View this run: Add an empty state to the tasks list");
  assert.equal(
    copy.viewPublicRunNamed(copy.emptyStateTitle),
    "View a public run: Add an empty state to the tasks list",
  );
});

test("title falls back to issue, then pull request, then untitled", () => {
  const withIssue = parseActiveRunsEnvelope(envelope([runRow({ title: null })])).value[0];
  assert.equal(heroRunTitle(withIssue, TITLE), "Run for issue #241");
  const withPr = parseActiveRunsEnvelope(envelope([runRow({ title: "   ", issue: null })])).value[0];
  assert.equal(heroRunTitle(withPr, TITLE), "Run for pull request #250");
  const untitled = parseActiveRunsEnvelope(envelope([runRow({ title: null, issue: null, pr: null })])).value[0];
  assert.equal(heroRunTitle(untitled, TITLE), "Active run");
  assert.equal(followRunHref(untitled), null);
});

test("follow CTA uses the PR hash when there is no issue, else a hosted live URL", () => {
  const prOnly = parseActiveRunsEnvelope(envelope([runRow({ issue: null })])).value[0];
  assert.deepEqual(followRunHref(prOnly), { href: "/issues#pr-250", offPath: false });
  const liveOnly = parseActiveRunsEnvelope(
    envelope([runRow({ issue: null, pr: null, liveUrl: hostedLive() })]),
  ).value[0];
  assert.deepEqual(followRunHref(liveOnly), { href: hostedLive(), offPath: true });
});

test("live URL allowlist matches the hosted console path", () => {
  assert.equal(sanitizeHeroLiveUrl(hostedLive()), hostedLive());
  assert.equal(sanitizeHeroLiveUrl("https://dev.zedkit.app/live/20261113T120000Z-hero1"), null);
  assert.equal(sanitizeHeroLiveUrl("https://evil.example/live/20261113T120000Z-hero1"), null);
});

test("empty runs and inactive or stale rows fall back to no live card", () => {
  assert.equal(selectActiveHeroRun(parseActiveRunsEnvelope(envelope([])).value), null);
  assert.equal(selectActiveHeroRun(parseActiveRunsEnvelope(envelope([runRow({ active: false })])).value), null);
  assert.equal(selectActiveHeroRun(parseActiveRunsEnvelope(envelope([runRow({ stale: true })])).value), null);
});

test("inactive or stale rows skip parse so a malformed inactive row clears", () => {
  const inactive = parseActiveRunsEnvelope(envelope([runRow({ active: false, runId: "../x" })]));
  assert.equal(inactive.ok, true);
  assert.deepEqual(inactive.value, []);
  const stale = parseActiveRunsEnvelope(envelope([runRow({ stale: true, title: 12 })]));
  assert.equal(stale.ok, true);
  assert.deepEqual(stale.value, []);
});

test("maps required steps by key and ignores extras and order", () => {
  const reordered = [...steps("build")].reverse();
  const extra = [...reordered, { key: "review", status: "done", summary: null }];
  const parsed = parseActiveRunsEnvelope(envelope([runRow({ steps: extra })]));
  assert.equal(parsed.ok, true);
  assert.deepEqual(
    parsed.value[0].steps.map((row) => row.key),
    ["plan", "build", "check", "fix", "done"],
  );
  assert.equal(parsed.value[0].steps[1]?.status, "active");
});

test("duplicate required step keys fail the card", () => {
  const duplicate = [...steps("build"), step("plan", "done", "again")];
  assert.equal(parseActiveRunsEnvelope(envelope([runRow({ steps: duplicate })])).ok, false);
});

test("version 1 envelopes parse without a kind field", () => {
  assert.equal(parseActiveRunsEnvelope(envelope([])).ok, true);
  assert.equal(parseActiveRunsEnvelope(envelope([], { kind: "other" })).ok, true);
  assert.equal(parseActiveRunsEnvelope({ version: 2, runs: [] }).ok, false);
});

test("malformed envelopes are errors so the card can keep the placeholder", () => {
  assert.equal(parseActiveRunsEnvelope(null).ok, false);
  assert.equal(parseActiveRunsEnvelope(envelope([runRow({ runId: "../x" })])).ok, false);
  assert.equal(parseActiveRunsEnvelope(envelope([runRow({ steps: steps("build").slice(0, 4) })])).ok, false);
  assert.equal(parseActiveRunsEnvelope(envelope([runRow({ title: 12 })])).ok, false);
  assert.equal(parseActiveRunsEnvelope(envelope([runRow({ issue: 0 })])).ok, false);
  assert.equal(parseActiveRunsEnvelope(envelope([runRow({ pr: -1 })])).ok, false);
});

test("polling continues while not paused when a base is resolvable", () => {
  const base = "https://dev.zedkit.app";
  assert.equal(nextLivePollMs(false, base), ACTIVE_HERO_POLL_MS);
  assert.equal(nextLivePollMs(true, base), null);
  assert.equal(nextLivePollMs(false, null), null);
});

test("live status copy names the active or failed step", () => {
  const run = parseActiveRunsEnvelope(envelope([runRow()])).value[0];
  assert.equal(heroStepLabel("build", copy), "Build");
  assert.match(liveUpdateMessage(run, copy), /Build in progress/);
  assert.match(liveUpdateMessage(run, copy, true), /Live updates paused/);
  const failedSteps = steps("check").map((row) =>
    row.key === "check" ? { ...row, status: "failed", summary: "hand-made button" } : row,
  );
  const failed = parseActiveRunsEnvelope(envelope([runRow({ steps: failedSteps })])).value[0];
  assert.match(liveUpdateMessage(failed, copy), /Failed: Check/);
});

test("fetch maps an active run and falls back when the list is empty", async () => {
  const calls = [];
  const fetchImpl = async (input) => {
    calls.push(String(input));
    return jsonResponse(200, envelope([runRow()]));
  };
  const hit = await fetchActiveHeroRun({
    envValue: "https://dev.zedkit.app",
    fetch: fetchImpl,
    retries: 0,
  });
  assert.equal(hit.ok, true);
  assert.equal(hit.value?.runId, "20261113T120000Z-hero1");
  assert.equal(calls[0], `https://dev.zedkit.app/${serviceName()}/api/runs?active=1&limit=1`);

  const empty = await fetchActiveHeroRun({
    envValue: "https://dev.zedkit.app",
    fetch: async () => jsonResponse(200, envelope([])),
    retries: 0,
  });
  assert.equal(empty.ok, true);
  assert.equal(empty.value, null);
});

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

test("live poll ticks immediately and reschedules after empty, error, throw, and success", async () => {
  const calls = [];
  const queued = [];
  let live = "unset";
  let settle;
  const stop = startHeroLivePoll({
    delayMs: ACTIVE_HERO_POLL_MS,
    setLive: (value) => {
      live = value;
    },
    setTimeoutFn: (fn, ms) => {
      queued.push({ fn, ms });
      return queued.length;
    },
    clearTimeoutFn: () => {
      queued.length = 0;
    },
    poll: () =>
      new Promise((resolve, reject) => {
        calls.push(calls.length);
        settle = { resolve, reject };
      }),
  });

  assert.deepEqual(calls, [0]);
  assert.equal(queued.length, 0);
  settle.resolve({ ok: true, value: null });
  await flushMicrotasks();
  assert.equal(live, null);
  assert.equal(queued.length, 1);
  assert.equal(queued[0]?.ms, ACTIVE_HERO_POLL_MS);

  queued.shift().fn();
  assert.deepEqual(calls, [0, 1]);
  settle.resolve({ ok: false, error: new Error("down") });
  await flushMicrotasks();
  assert.equal(live, null);
  assert.equal(queued.length, 1);

  queued.shift().fn();
  assert.deepEqual(calls, [0, 1, 2]);
  settle.reject(new Error("boom"));
  await flushMicrotasks();
  assert.equal(live, null);
  assert.equal(queued.length, 1);

  queued.shift().fn();
  assert.deepEqual(calls, [0, 1, 2, 3]);
  settle.resolve({ ok: true, value: runRow() });
  await flushMicrotasks();
  assert.equal(live?.runId, "20261113T120000Z-hero1");
  stop();
});

test("live poll abort ignores an in-flight result", async () => {
  let live = "unset";
  let resolvePoll;
  const hanging = new Promise((resolve) => {
    resolvePoll = resolve;
  });
  const stop = startHeroLivePoll({
    delayMs: ACTIVE_HERO_POLL_MS,
    setLive: (value) => {
      live = value;
    },
    setTimeoutFn: () => 1,
    clearTimeoutFn: () => undefined,
    poll: () => hanging,
  });
  stop();
  resolvePoll({ ok: true, value: runRow() });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(live, "unset");
});

test("fetch failure leaves the caller with an error to keep the placeholder", async () => {
  const rejected = await fetchActiveHeroRun({
    envValue: "https://dev.zedkit.app",
    fetch: async () => {
      throw new Error("network down");
    },
    retries: 0,
  });
  assert.equal(rejected.ok, false);

  const http = await fetchActiveHeroRun({
    envValue: "https://dev.zedkit.app",
    fetch: async () => jsonResponse(500, { error: "nope" }),
    retries: 0,
  });
  assert.equal(http.ok, false);

  const noBase = await fetchActiveHeroRun({ hostname: "localhost", retries: 0 });
  assert.equal(noBase.ok, true);
  assert.equal(noBase.value, null);
});
