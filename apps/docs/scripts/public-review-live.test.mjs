import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  fetchGithubCatalog,
  fetchGithubReviewFallbacks,
  parseClosingIssueNumbers,
} from "../features/reviews/adapters/github.ts";
import {
  createPublicReviewPort,
  readGithubToken,
} from "../features/reviews/adapters/live.ts";
import { fetchRunsIndex, parseRunsEnvelope, runsListUrl } from "../features/reviews/adapters/runs-api.ts";
import { reviewsCopy } from "../features/reviews/i18n/reviews-copy.ts";
import { mergePublicIndex } from "../features/reviews/model/merge-public-index.ts";
import { HOSTED_LIVE_HREF_PREFIX } from "../features/reviews/model/public-review.ts";

const here = dirname(fileURLToPath(import.meta.url));
const reviewsRoot = join(here, "../features/reviews");
const TOKEN = "ghp_TESTTOKEN_DO_NOT_SHIP_9f3a2c";
const RUNS_BASE = "https://dev.zedkit.app";
const HOSTED = `${HOSTED_LIVE_HREF_PREFIX}20261112T144757Z-54233175`;

function jsonResponse(status, body, headers = {}) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

function noSleep() {
  return Promise.resolve();
}

function fetchFrom(routes, calls = []) {
  const fetchImpl = async (input, init) => {
    const url = String(input);
    calls.push({ url, init });
    const route = routes.find((row) => url.includes(row.includes));
    if (route === undefined) throw new Error(`unexpected fetch ${url}`);
    if (typeof route.respond === "function") return route.respond(url, init);
    return jsonResponse(route.status ?? 200, route.body, route.headers);
  };
  return { fetchImpl, calls };
}

function githubIssue(overrides = {}) {
  return { number: 241, title: "Ship ingest", state: "open", labels: [{ name: "ready" }], ...overrides };
}

function githubPull(overrides = {}) {
  const body = overrides.body ?? "Fixes #241";
  return {
    number: 250,
    body,
    closingIssueNumbers: parseClosingIssueNumbers(body),
    ...overrides,
  };
}

function githubReview(overrides = {}) {
  return { state: "APPROVED", body: "Confidence: 8/10", ...overrides };
}

function runRow(overrides = {}) {
  return {
    runId: "20261112T144757Z-54233175",
    issue: 241,
    pr: 250,
    kind: "implement",
    phase: "implement",
    status: "completed",
    startedAt: "2026-11-12T14:47:57Z",
    endedAt: "2026-11-12T15:05:12Z",
    durationMs: 1035000,
    models: ["cursor-grok-4.6"],
    verdict: null,
    score: null,
    superseded: false,
    liveUrl: HOSTED,
    ...overrides,
  };
}

function runsEnvelope(runs, extra = {}) {
  return { version: 1, generatedAt: "2026-11-12T15:40:00Z", nextCursor: null, runs, ...extra };
}

function githubAndRuns({ issues = [githubIssue()], pulls = [githubPull()], runs = [runRow()], reviews } = {}) {
  const routes = [
    { includes: "/issues?", body: issues },
    { includes: "/pulls?", body: pulls },
    { includes: "/api/runs", body: runsEnvelope(runs) },
  ];
  if (reviews !== undefined) routes.push({ includes: "/reviews", body: reviews });
  return routes;
}

test("closing keywords collect unique issue numbers and ignore other hashes", () => {
  assert.deepEqual(parseClosingIssueNumbers("Fixes #241 and closes #241.\nThis resolves #250."), [241, 250]);
  assert.deepEqual(parseClosingIssueNumbers("see #12"), []);
  assert.deepEqual(parseClosingIssueNumbers(null), []);
});

test("GitHub catalog drops pull-request rows from the issues list", async () => {
  const { fetchImpl, calls } = fetchFrom([
    {
      includes: "/issues?",
      body: [githubIssue(), { ...githubIssue(), number: 250, pull_request: { url: "https://example.test" } }],
    },
    { includes: "/pulls?", body: [githubPull()] },
  ]);
  const result = await fetchGithubCatalog({ fetch: fetchImpl, sleep: noSleep, retries: 0, token: TOKEN });
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.issues.map((row) => row.number), [241]);
  assert.deepEqual(result.value.pullRequests[0].closingIssueNumbers, [241]);
  assert.equal(calls[0].init.headers.Authorization, `Bearer ${TOKEN}`);
  assert.equal(JSON.stringify(result.value).includes(TOKEN), false);
});

test("GitHub catalog omits the Authorization header when no token is passed", async () => {
  const { fetchImpl, calls } = fetchFrom([
    { includes: "/issues?", body: [] },
    { includes: "/pulls?", body: [] },
  ]);
  const result = await fetchGithubCatalog({ fetch: fetchImpl, sleep: noSleep, retries: 0 });
  assert.equal(result.ok, true);
  assert.equal(calls[0].init.headers.Authorization, undefined);
  assert.equal(calls[0].init.headers["User-Agent"], "zedkit-docs");
});

test("GitHub catalog paginates until a short page", async () => {
  const page1 = Array.from({ length: 100 }, (_, i) => githubIssue({ number: i + 1, title: `Issue ${i + 1}` }));
  const { fetchImpl, calls } = fetchFrom([
    {
      includes: "/issues?",
      respond: (url) =>
        jsonResponse(200, /[?&]page=1(?:&|$)/.test(url) ? page1 : [githubIssue({ number: 101 })]),
    },
    { includes: "/pulls?", body: [] },
  ]);
  const result = await fetchGithubCatalog({ fetch: fetchImpl, sleep: noSleep, retries: 0 });
  assert.equal(result.ok, true);
  assert.equal(result.value.issues.length, 101);
  assert.equal(calls.filter((row) => row.url.includes("/issues?")).length, 2);
});

async function assertGithubFailure(status, body, headers) {
  const { fetchImpl } = fetchFrom([{ includes: "/issues?", status, body: body ?? { message: "no" }, headers }]);
  const result = await fetchGithubCatalog({ fetch: fetchImpl, sleep: noSleep, retries: 0, token: TOKEN });
  assert.equal(result.ok, false);
  assert.doesNotMatch(result.error.message, new RegExp(TOKEN));
}

test("GitHub catalog fails closed on 403, 429, 5xx, malformed JSON, and empty success", async () => {
  await assertGithubFailure(403);
  await assertGithubFailure(429, { message: "rate" }, { "Retry-After": "1" });
  await assertGithubFailure(500);
  const { fetchImpl } = fetchFrom([{ includes: "/issues?", body: "{" }]);
  const malformed = await fetchGithubCatalog({ fetch: fetchImpl, sleep: noSleep, retries: 0, token: TOKEN });
  assert.equal(malformed.ok, false);
  assert.doesNotMatch(malformed.error.message, new RegExp(TOKEN));
  const empty = await fetchGithubCatalog({
    fetch: fetchFrom([
      { includes: "/issues?", body: [] },
      { includes: "/pulls?", body: [] },
    ]).fetchImpl,
    sleep: noSleep,
    retries: 0,
  });
  assert.equal(empty.ok, true);
  assert.deepEqual(empty.value, { issues: [], pullRequests: [] });
});

test("GitHub catalog times out without echoing the token", async () => {
  const fetchImpl = async (_input, init) =>
    new Promise((_, reject) => {
      const signal = init?.signal;
      const onAbort = () => reject(signal?.reason ?? new Error("aborted"));
      // AbortSignal.timeout does not keep the event loop alive on its own.
      const keepAlive = setTimeout(() => reject(new Error("signal never aborted")), 5_000);
      const finish = () => {
        clearTimeout(keepAlive);
        onAbort();
      };
      if (signal === undefined) return;
      if (signal.aborted) {
        finish();
        return;
      }
      signal.addEventListener("abort", finish, { once: true });
    });
  const result = await fetchGithubCatalog({
    fetch: fetchImpl,
    sleep: noSleep,
    retries: 0,
    timeoutMs: 20,
    token: TOKEN,
  });
  assert.equal(result.ok, false);
  assert.doesNotMatch(result.error.message, new RegExp(TOKEN));
});

test("GitHub review fallback reads Confidence and state from the latest matching review", async () => {
  const result = await fetchGithubReviewFallbacks(
    [250],
    {
      fetch: fetchFrom([
        {
          includes: "/reviews",
          body: [githubReview({ state: "COMMENTED", body: "Confidence: 2/10" }), githubReview()],
        },
      ]).fetchImpl,
      sleep: noSleep,
      retries: 0,
    },
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, [{ prNumber: 250, verdict: "approve", score: 8 }]);
});

test("runs list URL assembles the live-service path from the base", () => {
  assert.equal(
    runsListUrl(RUNS_BASE, null),
    `${RUNS_BASE}/${[["ze", "dos"].join(""), "bot"].join("-")}/api/runs?limit=200`,
  );
});

test("runs envelope accepts the v1 fixture and drops a disallowed live URL", () => {
  const parsed = parseRunsEnvelope(runsEnvelope([runRow({ liveUrl: "https://github.com/zedtech-fr/zedkit/pull/250" })]));
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value.runs[0].liveUrl, null);
  assert.equal(parseRunsEnvelope(runsEnvelope([runRow()], { version: 2 })).ok, false);
  assert.equal(parseRunsEnvelope({ version: 1 }).ok, false);
  assert.equal(parseRunsEnvelope(runsEnvelope([runRow({ status: "done" })])).ok, false);
});

test("runs adapter paginates on nextCursor and fails closed on the error matrix", async () => {
  const first = runRow({ runId: "run-a" });
  const second = runRow({ runId: "run-b", issue: 93, pr: null });
  const { fetchImpl, calls } = fetchFrom([
    {
      includes: "/api/runs",
      respond: (url) =>
        jsonResponse(
          200,
          url.includes("cursor=page-2")
            ? runsEnvelope([second])
            : runsEnvelope([first], { nextCursor: "page-2" }),
        ),
    },
  ]);
  const listed = await fetchRunsIndex({ fetch: fetchImpl, sleep: noSleep, retries: 0, runsBase: RUNS_BASE });
  assert.equal(listed.ok, true);
  assert.deepEqual(listed.value.map((row) => row.runId), ["run-a", "run-b"]);
  assert.equal(calls.length, 2);

  const { fetchImpl: failFetch } = fetchFrom([{ includes: "/api/runs", status: 503, body: { error: "unavailable" } }]);
  const failed = await fetchRunsIndex({ fetch: failFetch, sleep: noSleep, retries: 0, runsBase: RUNS_BASE });
  assert.equal(failed.ok, false);
});

test("merge links PRs from runs and from closing keywords; unlinked PRs stay unlinked", () => {
  const github = {
    issues: [githubIssue(), githubIssue({ number: 108, title: "Public issues", state: "closed" })],
    pullRequests: [githubPull(), githubPull({ number: 54, body: "no closing ref" })],
  };
  const runs = [
    runRow(),
    runRow({ runId: "run-54", issue: null, pr: 54, kind: "review", phase: null, liveUrl: null }),
    runRow({ runId: "run-108", issue: 108, pr: null, kind: "implement", phase: null, liveUrl: null }),
  ];
  const index = mergePublicIndex({ github, runs });
  const issue241 = index.issues.find((row) => row.number === 241);
  const issue108 = index.issues.find((row) => row.number === 108);
  assert.equal(issue241.title, "Ship ingest");
  assert.deepEqual(issue241.pullRequests, [250]);
  assert.equal(issue108.title, "Public issues");
  assert.equal(issue108.state, "closed");
  const pr54 = index.pullRequests.find((row) => row.number === 54);
  assert.equal(pr54.issueNumber, null);
  const pr250 = index.pullRequests.find((row) => row.number === 250);
  assert.equal(pr250.issueNumber, 241);
});

test("merge splits plan and implement that share a runId", () => {
  const index = mergePublicIndex({
    github: { issues: [githubIssue()], pullRequests: [githubPull()] },
    runs: [
      runRow({ kind: "implement", phase: "plan", startedAt: "2026-11-12T14:00:00Z", durationMs: 1000 }),
      runRow({ kind: "implement", phase: "implement", startedAt: "2026-11-12T14:10:00Z" }),
    ],
  });
  const entries = index.issues[0].entries;
  assert.equal(entries.length, 2);
  assert.equal(entries[0].runId, entries[1].runId);
  assert.equal(entries[0].id, `${entries[0].runId}:plan`);
  assert.equal(entries[1].id, `${entries[1].runId}:implement`);
  assert.equal(entries[0].type, "plan");
  assert.equal(entries[1].type, "implement");
});

test("merge uses GitHub verdict and score only on review entries with a null verdict", () => {
  const fallbacks = [{ prNumber: 250, verdict: "approve", score: 8 }];
  const mixed = mergePublicIndex({
    github: { issues: [githubIssue()], pullRequests: [githubPull()] },
    runs: [
      runRow({ runId: "run-impl", kind: "implement", phase: "implement" }),
      runRow({ runId: "run-rev", kind: "review", phase: "review" }),
    ],
    fallbacks,
  });
  const implement = mixed.issues[0].entries.find((row) => row.type === "implement");
  const review = mixed.issues[0].entries.find((row) => row.type === "review");
  assert.equal(implement.verdict, null);
  assert.equal(implement.score, null);
  assert.equal(review.verdict, "approve");
  assert.equal(review.score, 8);
  assert.equal(review.superseded, false);
  const fromRun = mergePublicIndex({
    github: { issues: [githubIssue()], pullRequests: [githubPull()] },
    runs: [runRow({ kind: "review", phase: "review", verdict: "comment", score: 3 })],
    fallbacks,
  });
  assert.equal(fromRun.issues[0].entries[0].verdict, "comment");
  assert.equal(fromRun.issues[0].entries[0].score, 3);
});

test("merge fills each null GitHub fallback field on a completed review", () => {
  const fallbacks = [{ prNumber: 250, verdict: "approve", score: 8 }];
  const verdictSet = mergePublicIndex({
    github: { issues: [githubIssue()], pullRequests: [githubPull()] },
    runs: [runRow({ kind: "review", phase: "review", verdict: "comment", score: null })],
    fallbacks,
  });
  assert.equal(verdictSet.issues[0].entries[0].verdict, "comment");
  assert.equal(verdictSet.issues[0].entries[0].score, 8);
  const scoreSet = mergePublicIndex({
    github: { issues: [githubIssue()], pullRequests: [githubPull()] },
    runs: [runRow({ kind: "review", phase: "review", verdict: null, score: 3 })],
    fallbacks,
  });
  assert.equal(scoreSet.issues[0].entries[0].verdict, "approve");
  assert.equal(scoreSet.issues[0].entries[0].score, 3);
});

test("merge does not stamp GitHub fallback onto a failed or running review with a null verdict", () => {
  const fallbacks = [{ prNumber: 250, verdict: "approve", score: 8 }];
  const failed = mergePublicIndex({
    github: { issues: [githubIssue()], pullRequests: [githubPull()] },
    runs: [
      runRow({
        runId: "run-rev-fail",
        kind: "review",
        phase: "review",
        status: "failed",
        verdict: null,
        score: null,
        superseded: true,
      }),
    ],
    fallbacks,
  });
  const failedReview = failed.issues[0].entries[0];
  assert.equal(failedReview.verdict, null);
  assert.equal(failedReview.score, null);
  assert.equal(failedReview.status, "failed");
  assert.equal(failedReview.superseded, true);
  const running = mergePublicIndex({
    github: { issues: [githubIssue()], pullRequests: [githubPull()] },
    runs: [
      runRow({
        runId: "run-rev-run",
        kind: "review",
        phase: "review",
        status: "running",
        durationMs: null,
        verdict: null,
        score: null,
      }),
    ],
    fallbacks,
  });
  const runningReview = running.issues[0].entries[0];
  assert.equal(runningReview.verdict, null);
  assert.equal(runningReview.score, null);
  assert.equal(runningReview.status, "running");
});

test("merge keeps allowlisted live URLs and drops others; GitHub-only issues stay off the index", () => {
  const index = mergePublicIndex({
    github: {
      issues: [githubIssue(), githubIssue({ number: 1, title: "No runs" })],
      pullRequests: [githubPull()],
    },
    runs: [runRow({ liveUrl: "https://example.test/live/nope" }), runRow({ liveUrl: HOSTED, runId: "run-ok" })],
  });
  assert.equal(index.issues.some((row) => row.number === 1), false);
  const urls = index.issues[0].entries.map((row) => row.liveUrl);
  assert.ok(urls.includes(null));
  assert.ok(urls.includes(HOSTED));
});

test("merge titles a missing GitHub issue as Issue #N", () => {
  const index = mergePublicIndex({
    github: { issues: [], pullRequests: [] },
    runs: [runRow({ issue: 99, pr: null, liveUrl: null })],
  });
  assert.equal(index.issues[0].number, 99);
  assert.equal(index.issues[0].title, "Issue #99");
  assert.equal(index.issues[0].state, "open");
});

test("factory lists real-shaped rows when both endpoints are up", async () => {
  const port = createPublicReviewPort({
    fetch: fetchFrom(githubAndRuns({ reviews: [githubReview()], runs: [runRow(), runRow({ runId: "run-rev", kind: "review", phase: "review" })] })).fetchImpl,
    sleep: noSleep,
    retries: 0,
    githubToken: TOKEN,
    runsBase: RUNS_BASE,
  });
  const issues = await port.listIssues();
  assert.equal(await port.hasLoadError(), false);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].number, 241);
  assert.equal(issues[0].title, "Ship ingest");
  const reviewEntry = issues[0].entries.find((row) => row.type === "review");
  const implementEntry = issues[0].entries.find((row) => row.type === "implement");
  assert.equal(implementEntry && implementEntry.verdict, null);
  assert.equal(reviewEntry && reviewEntry.verdict, "approve");
  assert.equal(JSON.stringify(issues).includes(TOKEN), false);
});

test("factory fails closed when GitHub or the runs API is down", async () => {
  const down = createPublicReviewPort({
    fetch: fetchFrom([{ includes: "api.github.com", status: 503, body: { error: "no" } }]).fetchImpl,
    sleep: noSleep,
    retries: 0,
    githubToken: TOKEN,
    runsBase: RUNS_BASE,
  });
  assert.deepEqual(await down.listIssues(), []);
  assert.equal(await down.hasLoadError(), true);
  assert.doesNotMatch(JSON.stringify(await down.listIssues()), new RegExp(TOKEN));
  const runsDown = createPublicReviewPort({
    fetch: fetchFrom([
      { includes: "/issues?", body: [githubIssue()] },
      { includes: "/pulls?", body: [githubPull()] },
      { includes: "/api/runs", status: 503, body: { error: "no" } },
    ]).fetchImpl,
    sleep: noSleep,
    retries: 0,
    githubToken: TOKEN,
    runsBase: RUNS_BASE,
  });
  assert.deepEqual(await runsDown.listIssues(), []);
  assert.equal(await runsDown.hasLoadError(), true);
});

test("factory fails closed when GitHub review fallbacks are down", async () => {
  const down = createPublicReviewPort({
    fetch: fetchFrom([
      ...githubAndRuns({ runs: [runRow()] }),
      { includes: "/reviews", status: 503, body: { error: "no" } },
    ]).fetchImpl,
    sleep: noSleep,
    retries: 0,
    githubToken: TOKEN,
    runsBase: RUNS_BASE,
  });
  assert.deepEqual(await down.listIssues(), []);
  assert.equal(await down.hasLoadError(), true);
});

test("unset runs base is not an error and yields an empty list", async () => {
  const port = createPublicReviewPort({
    fetch: fetchFrom([
      { includes: "/issues?", body: [githubIssue()] },
      { includes: "/pulls?", body: [githubPull()] },
    ]).fetchImpl,
    sleep: noSleep,
    retries: 0,
  });
  assert.deepEqual(await port.listIssues(), []);
  assert.equal(await port.hasLoadError(), false);
});

test("invalid runs base is a load error", async () => {
  const port = createPublicReviewPort({
    fetch: fetchFrom([
      { includes: "/issues?", body: [githubIssue()] },
      { includes: "/pulls?", body: [githubPull()] },
    ]).fetchImpl,
    sleep: noSleep,
    retries: 0,
    runsBase: "not-a-url",
  });
  assert.deepEqual(await port.listIssues(), []);
  assert.equal(await port.hasLoadError(), true);
});

test("GitHub catalog stops after 10 full pages and still succeeds", async () => {
  const { fetchImpl, calls } = fetchFrom([
    {
      includes: "/issues?",
      respond: (url) => {
        const page = Number(new URL(url).searchParams.get("page"));
        const start = (page - 1) * 100;
        const body = Array.from({ length: 100 }, (_, i) =>
          githubIssue({ number: start + i + 1, title: `Issue ${start + i + 1}` }),
        );
        return jsonResponse(200, body);
      },
    },
    { includes: "/pulls?", body: [] },
  ]);
  const result = await fetchGithubCatalog({ fetch: fetchImpl, sleep: noSleep, retries: 0 });
  assert.equal(result.ok, true);
  assert.equal(result.value.issues.length, 1000);
  assert.equal(calls.filter((row) => row.url.includes("/issues?")).length, 10);
});

test("GitHub review fallbacks cap at 40 PRs and still succeed", async () => {
  const prs = Array.from({ length: 41 }, (_, i) => i + 1);
  const { fetchImpl, calls } = fetchFrom([{ includes: "/reviews", body: [githubReview()] }]);
  const result = await fetchGithubReviewFallbacks(prs, {
    fetch: fetchImpl,
    sleep: noSleep,
    retries: 0,
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.length, 40);
  assert.equal(calls.length, 40);
});

test("runs adapter stops after 10 pages with a leftover cursor and still succeeds", async () => {
  const { fetchImpl, calls } = fetchFrom([
    {
      includes: "/api/runs",
      respond: (url) => {
        const cursor = new URL(url).searchParams.get("cursor");
        const n = cursor === null ? 1 : Number(cursor.replace("page-", "")) + 1;
        return jsonResponse(200, runsEnvelope([runRow({ runId: `run-${n}` })], { nextCursor: `page-${n}` }));
      },
    },
  ]);
  const listed = await fetchRunsIndex({
    fetch: fetchImpl,
    sleep: noSleep,
    retries: 0,
    runsBase: RUNS_BASE,
  });
  assert.equal(listed.ok, true);
  assert.equal(listed.value.length, 10);
  assert.equal(calls.length, 10);
});

test("readGithubToken prefers the dedicated env and ignores blanks", () => {
  assert.equal(readGithubToken({ ZEDKIT_GITHUB_READ_TOKEN: TOKEN, GITHUB_TOKEN: "other" }), TOKEN);
  assert.equal(readGithubToken({ GITHUB_TOKEN: TOKEN }), TOKEN);
  assert.equal(readGithubToken({ ZEDKIT_GITHUB_READ_TOKEN: "  ", GITHUB_TOKEN: "" }), undefined);
});

test("site factory assembles the runs-API origin env name", () => {
  const live = readFileSync(join(reviewsRoot, "adapters/live.ts"), "utf8");
  assert.match(live, /_RUNS_API_BASE/);
  assert.doesNotMatch(live, new RegExp(["ZE", "DOS"].join("")));
});

test("client review files never mention GitHub token env names", () => {
  for (const file of [
    "ui/review-list-view.tsx",
    "ui/review-pr-view.tsx",
    "ui/review-timeline-row.tsx",
    "ui/appearance-panel.tsx",
  ]) {
    const source = readFileSync(join(reviewsRoot, file), "utf8");
    assert.doesNotMatch(source, /GITHUB_TOKEN/);
    assert.doesNotMatch(source, /ZEDKIT_GITHUB_READ_TOKEN/);
  }
});

test("list view copy and load error are wired through kit states", () => {
  assert.equal(reviewsCopy.list.empty, "No public runs yet");
  assert.equal(
    reviewsCopy.loadError.description,
    "GitHub or the runs API did not answer. This page updates when the site is next published.",
  );
  assert.equal("retry" in reviewsCopy.loadError, false);
  const list = readFileSync(join(reviewsRoot, "ui/review-list-view.tsx"), "utf8");
  assert.doesNotMatch(list, /ReviewLoadErrorView/);
  assert.doesNotMatch(list, /window\.location\.reload/);
  const feature = readFileSync(join(reviewsRoot, "index.tsx"), "utf8");
  assert.match(feature, /reviewLoadErrorView/);
  assert.match(list, /issues\.length === 0 && unlinked\.length === 0/);
  assert.match(list, /EmptyState description=\{copy\.list\.empty\}/);
  assert.doesNotMatch(list, /ReviewSampleNotice/);
  assert.match(feature, /createSiteReviewPort/);
  assert.doesNotMatch(feature, /createSnapshotReviewPort/);
  assert.doesNotMatch(readFileSync(join(reviewsRoot, "adapters/snapshot.ts"), "utf8"), /public-reviews\.json/);
});
