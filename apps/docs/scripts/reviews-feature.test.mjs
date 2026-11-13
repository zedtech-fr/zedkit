import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createFixtureReviewPort } from "../features/reviews/adapters/fixture.ts";
import { createComposedReviewPort } from "../features/reviews/model/port-from-index.ts";
import {
  createSnapshotReviewPort,
  listIssueSitemapPaths,
  listReviewSitemapPaths,
} from "../features/reviews/adapters/snapshot.ts";
import { reviewsCopy } from "../features/reviews/i18n/reviews-copy.ts";
import { displayModelLabel, displayModelLabels } from "../features/reviews/model/display-model.ts";
import {
  entriesNewestFirst,
  entryUpdatedAt,
  headlineOutcome,
  latestEntry,
  latestFinishedEntry,
  latestStatus,
  summedDurationMs,
} from "../features/reviews/model/latest-status.ts";
import { parsePublicReviewSnapshot } from "../features/reviews/model/parse-snapshot.ts";
import { parsePrNumber } from "../features/reviews/model/pr-number.ts";
import {
  assertPubliclySafe,
  HOSTED_LIVE_HREF_PREFIX,
  isExportableVisibility,
  liveRunsToIndex,
  sanitizeLiveUrl,
  toPublicIndex,
  toPublicReviews,
} from "../features/reviews/model/public-review.ts";
import {
  issueIndexRobotsFrom,
  issuePath,
  issueRunPath,
  linkedPrFallbackPath,
  linkedPrRunFallbackPath,
  listIssueParamsFrom,
  listIssueRunParamsFrom,
  listIssueSitemapPathsFrom,
  listReviewPrParamsFrom,
  listIssueRunRedirectsFrom,
  listReviewRedirectsFrom,
  listReviewRunParamsFrom,
  listReviewSitemapPathsFrom,
  listUnlinkedPrParamsFrom,
  listUnlinkedRunParamsFrom,
  redirectPathForPr,
  redirectPathForPrRun,
  runRedirectTarget,
  RETIRED_REVIEW_PR_NUMBERS,
  unlinkedPrPath,
  unlinkedRunPath,
} from "../features/reviews/model/review-routes.ts";
import { toAgentConsole } from "../features/reviews/model/to-agent-console.ts";
import { mergeReviewShareUrl } from "../features/reviews/model/selection.ts";

const here = dirname(fileURLToPath(import.meta.url));
const reviewsRoot = join(here, "../features/reviews");
const reviewsAppRoot = join(here, "../app/(site)/reviews");
const issuesAppRoot = join(here, "../app/(site)/issues");
const issuesRunAppRoot = join(here, "../app/(run-console)/issues");

function entry(overrides = {}) {
  return {
    id: "108-plan",
    runId: "run-108-impl",
    type: "plan",
    status: "completed",
    startedAt: "2026-11-10T16:00:00.000Z",
    durationMs: 420000,
    models: ["cursor-grok-4.6-high"],
    verdict: null,
    liveUrl: `${HOSTED_LIVE_HREF_PREFIX}run-108-impl`,
    ...overrides,
  };
}

function issue(overrides = {}) {
  return {
    number: 108,
    title: "Ship the public issues section",
    state: "closed",
    pullRequests: [133],
    lastRunAt: "2026-11-10T16:00:00.000Z",
    entries: [entry()],
    ...overrides,
  };
}

function pr(overrides = {}) {
  return {
    number: 133,
    issueNumber: 108,
    runIds: ["run-108-impl"],
    ...overrides,
  };
}

function wrapper(issues, pullRequests = [pr()], extra = {}) {
  return { version: 1, kind: "public-stand-in", issues, pullRequests, ...extra };
}

function parsedIndex(issues, pullRequests, extra) {
  const parsed = parsePublicReviewSnapshot(wrapper(issues, pullRequests, extra));
  assert.equal(parsed.ok, true, parsed.ok ? "" : parsed.error.message);
  return parsed.value;
}

function exportedAsync(source, name) {
  const marker = `export async function ${name}`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, name);
  const next = source.indexOf("\nexport ", start + marker.length);
  return source.slice(start, next === -1 ? source.length : next);
}

function pinsLoadErrorBeforeNotFound(body) {
  const loadErrorAt = body.search(/reviewLoadErrorView\(/);
  const notFoundAt = body.search(/\bnotFound\(\)/);
  assert.notEqual(loadErrorAt, -1, "missing reviewLoadErrorView");
  assert.notEqual(notFoundAt, -1, "missing notFound");
  assert.ok(loadErrorAt < notFoundAt, "load error must run before notFound");
}

test("public-repo visibility: missing, null, and public are exportable; only private is dropped", () => {
  assert.equal(isExportableVisibility(undefined), true);
  assert.equal(isExportableVisibility(null), true);
  assert.equal(isExportableVisibility("public"), true);
  assert.equal(isExportableVisibility("team"), true);
  assert.equal(isExportableVisibility("private"), false);
  const gated = toPublicIndex(
    parsedIndex(
      [
        issue({ number: 99, visibility: "private", title: "secret" }),
        issue({ number: 98, visibility: "team", title: "unknown flag" }),
        issue({ number: 97, title: "no flag" }),
        issue({ number: 96, visibility: null, title: "null flag" }),
        issue({ number: 95, visibility: "public", title: "marked public" }),
      ],
      [
        pr({
          number: 50,
          issueNumber: null,
          runIds: ["run-50"],
          visibility: "private",
          entries: [entry({ id: "50-review", runId: "run-50" })],
        }),
        pr({
          number: 51,
          issueNumber: null,
          runIds: ["run-51"],
          visibility: "public",
          entries: [entry({ id: "51-review", runId: "run-51" })],
        }),
      ],
    ),
  );
  assert.deepEqual(
    gated.issues.map((row) => row.number),
    [98, 97, 96, 95],
  );
  assert.deepEqual(
    gated.pullRequests.map((row) => row.number),
    [51],
  );
});

test("secret-like keys, bearer tokens, and home paths do not survive the public gate", () => {
  const parsed = parsedIndex([
    issue({
      title: "Call with Bearer abcDEF123._~+/=- from /home/alice/kit/token",
      entries: [
        entry({
          models: [
            "Bearer xyzTOKEN789._~+/=- lives in /home/bob/kit",
            "Authorization: Basic dXNlcjpwYXNz lives in /Users/alice/.config",
          ],
          liveUrl: "https://example.test/live/run-108-impl",
        }),
      ],
    }),
  ]);
  const dirty = {
    ...parsed,
    issues: parsed.issues.map((row) => ({
      ...row,
      token: "super-secret",
      token_hash: "abc",
      prompt: "do not ship",
    })),
  };
  const [clean] = toPublicIndex(dirty).issues;
  assert.equal(clean.token, "[redacted]");
  assert.equal(clean.token_hash, "[redacted]");
  assert.equal(clean.prompt, "[redacted]");
  assert.match(clean.title, /Bearer \[redacted\]/);
  assert.doesNotMatch(clean.title, /abcDEF123/);
  assert.match(clean.title, /\[path\]/);
  assert.doesNotMatch(clean.title, /\/home\/alice/);
  assert.match(clean.entries[0].models[0], /Bearer \[redacted\]/);
  assert.doesNotMatch(clean.entries[0].models[0], /xyzTOKEN789/);
  assert.doesNotMatch(clean.entries[0].models[0], /\/home\/bob/);
  assert.match(clean.entries[0].models[1], /Basic \[redacted\]/);
  assert.doesNotMatch(clean.entries[0].models[1], /dXNlcjpwYXNz/);
  assert.doesNotMatch(clean.entries[0].models[1], /\/Users\/alice/);
});

function hostedLiveHref(runId = "abc") {
  return `${HOSTED_LIVE_HREF_PREFIX}${runId}`;
}

test("sanitizeLiveUrl keeps an allowlisted hosted-console href", () => {
  const specPrefix = `https://dev.zedkit.app/${Buffer.from("emVkb3MtYm90", "base64").toString("utf8")}/live/`;
  assert.equal(HOSTED_LIVE_HREF_PREFIX, specPrefix);
  assert.equal(sanitizeLiveUrl(hostedLiveHref()), hostedLiveHref());
});

test("sanitizeLiveUrl accepts a trailing slash and returns none", () => {
  assert.equal(sanitizeLiveUrl(`${hostedLiveHref()}/`), hostedLiveHref());
});

test("sanitizeLiveUrl drops a reserved .test host", () => {
  assert.equal(sanitizeLiveUrl("https://example.test/live/abc"), null);
});

test("sanitizeLiveUrl drops a reserved .example host", () => {
  assert.equal(sanitizeLiveUrl("https://foo.example/live/abc"), null);
});

test("sanitizeLiveUrl drops a reserved .invalid host", () => {
  assert.equal(sanitizeLiveUrl("https://foo.invalid/live/abc"), null);
});

test("sanitizeLiveUrl drops localhost", () => {
  assert.equal(sanitizeLiveUrl("https://localhost/live/abc"), null);
});

test("sanitizeLiveUrl drops example.com", () => {
  assert.equal(sanitizeLiveUrl("https://example.com/live/abc"), null);
});

test("sanitizeLiveUrl drops example.org", () => {
  assert.equal(sanitizeLiveUrl("https://example.org/live/abc"), null);
});

test("sanitizeLiveUrl drops example.net", () => {
  assert.equal(sanitizeLiveUrl("https://example.net/live/abc"), null);
});

test("sanitizeLiveUrl drops another host on the same site family", () => {
  assert.equal(sanitizeLiveUrl("https://zedkit.app/live/abc"), null);
});

test("sanitizeLiveUrl drops a preview host", () => {
  assert.equal(
    sanitizeLiveUrl(hostedLiveHref().replace("https://dev.zedkit.app", "https://epic-73.dev.zedkit.app")),
    null,
  );
});

test("sanitizeLiveUrl drops another path on the allowlisted host", () => {
  assert.equal(sanitizeLiveUrl("https://dev.zedkit.app/other/live/abc"), null);
});

test("sanitizeLiveUrl drops http", () => {
  assert.equal(sanitizeLiveUrl(hostedLiveHref().replace("https:", "http:")), null);
});

test("sanitizeLiveUrl drops a query", () => {
  assert.equal(sanitizeLiveUrl(`${hostedLiveHref()}?token=secret`), null);
});

test("sanitizeLiveUrl drops a hash", () => {
  assert.equal(sanitizeLiveUrl(`${hostedLiveHref()}#frag`), null);
});

test("sanitizeLiveUrl drops userinfo", () => {
  assert.equal(
    sanitizeLiveUrl(hostedLiveHref().replace("https://", "https://user:pass@")),
    null,
  );
});

test("sanitizeLiveUrl drops a non-empty port", () => {
  assert.equal(sanitizeLiveUrl(hostedLiveHref().replace("dev.zedkit.app", "dev.zedkit.app:8443")), null);
});

test("sanitizeLiveUrl drops empty, null, and blank", () => {
  assert.equal(sanitizeLiveUrl(null), null);
  assert.equal(sanitizeLiveUrl(""), null);
  assert.equal(sanitizeLiveUrl("   "), null);
});

test("sanitizeLiveUrl drops a run id that is not path-safe", () => {
  assert.equal(sanitizeLiveUrl(`${HOSTED_LIVE_HREF_PREFIX}..`), null);
  assert.equal(sanitizeLiveUrl(`${HOSTED_LIVE_HREF_PREFIX}has space`), null);
});

test("sanitizeLiveUrl drops an extra path segment", () => {
  assert.equal(sanitizeLiveUrl(`${hostedLiveHref()}/extra`), null);
});

test("toPublicIndex keeps an allowlisted liveUrl and drops a reserved host", () => {
  const gated = toPublicIndex(
    parsedIndex([
      issue({
        entries: [
          entry({ liveUrl: hostedLiveHref("ok") }),
          entry({
            id: "secret-url",
            liveUrl: "https://example.test/live/no?token=abc",
          }),
        ],
      }),
    ]),
  );
  assert.equal(gated.issues[0].entries[0].liveUrl, hostedLiveHref("ok"));
  assert.equal(gated.issues[0].entries[1].liveUrl, null);
});

test("sanitizeLiveUrl drops home-path URLs on every call", () => {
  const home = "https://example.test/home/alice/secret";
  const users = "https://example.test/Users/bob/kit";
  assert.equal(sanitizeLiveUrl(home), null);
  assert.equal(sanitizeLiveUrl(home), null);
  assert.equal(sanitizeLiveUrl(home), null);
  assert.equal(sanitizeLiveUrl(users), null);
  assert.equal(sanitizeLiveUrl(users), null);
});

test("a version-1 snapshot parses issues and pull requests", () => {
  const parsed = parsePublicReviewSnapshot(wrapper([issue()]));
  assert.equal(parsed.ok, true);
  assert.deepEqual(
    parsed.value.issues.map((row) => row.number),
    [108],
  );
  assert.equal(parsed.value.pullRequests[0].issueNumber, 108);
});

test("a hybrid snapshot with issues and reviews is parsed as an index", () => {
  const parsed = parsePublicReviewSnapshot({
    ...wrapper([issue()]),
    reviews: [liveSample()],
  });
  assert.equal(parsed.ok, true);
  assert.equal(Array.isArray(parsed.value), false);
  assert.equal(parsed.value.issues[0].number, 108);
});

test("run ids that are not a safe path segment fail closed", () => {
  const traversal = parsePublicReviewSnapshot(
    wrapper([issue({ entries: [entry({ runId: "../etc/passwd" })] })]),
  );
  assert.equal(traversal.ok, false);
  const live = parsePublicReviewSnapshot(
    liveWrapper([liveSample({ run: { ...liveSample().run, run_id: "../../x" } })]),
  );
  assert.equal(live.ok, false);
});

test("an empty snapshot is valid", () => {
  const parsed = parsePublicReviewSnapshot(wrapper([], []));
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.value.issues, []);
  assert.deepEqual(parsed.value.pullRequests, []);
});

test("an unknown snapshot kind is accepted when version is 1", () => {
  const parsed = parsePublicReviewSnapshot(wrapper([issue()], [pr()], { kind: "redacted-export" }));
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value.kind, "redacted-export");
});

test("version 2 snapshots are rejected", () => {
  const parsed = parsePublicReviewSnapshot(wrapper([issue()], [pr()], { version: 2 }));
  assert.equal(parsed.ok, false);
});

test("extra keys on the wrapper, issues, pull requests, and entries are ignored", () => {
  const parsed = parsePublicReviewSnapshot(
    wrapper(
      [
        issue({
          denseLive: { agents: [] },
          entries: [entry({ lens_model: "x", second_pass_model: "y" })],
        }),
      ],
      [pr({ hostedPath: "/ignored" })],
      { exporter: "out-of-repo", token: "x" },
    ),
  );
  assert.equal(parsed.ok, true);
  assert.equal("denseLive" in parsed.value.issues[0], false);
  assert.equal("lens_model" in parsed.value.issues[0].entries[0], false);
  assert.equal("hostedPath" in parsed.value.pullRequests[0], false);
  assert.equal("exporter" in parsed.value, false);
});

test("a snapshot with a missing required field is rejected", () => {
  const rest = issue();
  delete rest.title;
  const parsed = parsePublicReviewSnapshot(wrapper([rest]));
  assert.equal(parsed.ok, false);
});

test("wrong types in a snapshot are rejected", () => {
  assert.equal(parsePublicReviewSnapshot(wrapper([issue({ number: "108" })])).ok, false);
  assert.equal(parsePublicReviewSnapshot(null).ok, false);
  assert.equal(parsePublicReviewSnapshot([]).ok, false);
});

test("private visibility is kept by parse so the public gate can drop it", () => {
  const parsed = parsePublicReviewSnapshot(wrapper([issue({ number: 99, visibility: "private" })]));
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value.issues[0].visibility, "private");
});

test("plan and implement phases share a runId and stay two timeline entries", () => {
  const parsed = parsedIndex([
    issue({
      entries: [
        entry({ id: "plan", type: "plan", startedAt: "2026-11-10T16:00:00.000Z" }),
        entry({
          id: "implement",
          type: "implement",
          startedAt: "2026-11-10T16:10:00.000Z",
        }),
      ],
    }),
  ]);
  assert.equal(parsed.issues[0].entries.length, 2);
  assert.equal(parsed.issues[0].entries[0].runId, parsed.issues[0].entries[1].runId);
  assert.deepEqual(
    parsed.issues[0].entries.map((row) => row.type),
    ["plan", "implement"],
  );
});

test("index models on implement, review, and improve survive parse and the snapshot port", async () => {
  const path = writeSnapshot([
    issue({
      entries: [
        entry({
          id: "plan",
          type: "plan",
          models: ["cursor-grok-4.6-high"],
        }),
        entry({
          id: "implement",
          type: "implement",
          startedAt: "2026-11-10T16:10:00.000Z",
          models: ["cursor-grok-4.6-high"],
        }),
        entry({
          id: "review",
          runId: "run-108-review",
          type: "review",
          startedAt: "2026-11-10T17:20:00.000Z",
          models: ["lens-model", "second-pass-model"],
          verdict: "approve",
          liveUrl: "https://example.test/live/run-108-review",
        }),
        entry({
          id: "improve",
          runId: "run-108-improve",
          type: "improve",
          startedAt: "2026-11-10T18:40:00.000Z",
          models: ["improve-model"],
          liveUrl: "https://example.test/live/run-108-improve",
        }),
      ],
    }),
  ]);
  const port = createSnapshotReviewPort(path);
  const listed = await port.listIssues();
  assert.equal(listed.length, 1);
  const byType = Object.fromEntries(listed[0].entries.map((row) => [row.type, [...row.models]]));
  assert.deepEqual(byType.plan, ["cursor-grok-4.6-high"]);
  assert.deepEqual(byType.implement, ["cursor-grok-4.6-high"]);
  assert.deepEqual(byType.review, ["lens-model", "second-pass-model"]);
  assert.deepEqual(byType.improve, ["improve-model"]);
  assert.deepEqual((await port.getRun(108, "run-108-review"))?.models, [
    "lens-model",
    "second-pass-model",
  ]);
  assert.deepEqual((await port.getRun(108, "run-108-impl"))?.models, ["cursor-grok-4.6-high"]);
});

test("unlinked pull request without entries fails closed", () => {
  const parsed = parsePublicReviewSnapshot(
    wrapper([], [{ number: 54, issueNumber: null, runIds: ["run-54-review"] }]),
  );
  assert.equal(parsed.ok, false);
});

test("linked PR entries stay on the PR row and are not merged into the issue", async () => {
  const extra = entry({ id: "pr-only", runId: "run-pr-only", type: "review" });
  const path = writeSnapshot([issue()], [pr({ entries: [extra] })]);
  const port = createSnapshotReviewPort(path);
  const issues = await port.listIssues();
  assert.ok(!issues[0].entries.some((row) => row.id === "pr-only"));
  assert.equal(await port.getRun(108, "run-pr-only"), null);
  const prs = await port.listPullRequests();
  assert.equal(prs[0].entries[0].id, "pr-only");
});

test("empty model strings are skipped", () => {
  const parsed = parsedIndex([issue({ entries: [entry({ models: ["", "kept-model", ""] })] })]);
  assert.deepEqual(parsed.issues[0].entries[0].models, ["kept-model"]);
});

test("dry-run type is kept on the generated run index", () => {
  const parsed = parsedIndex([
    issue({
      entries: [entry({ id: "dry", runId: "run-dry", type: "dry-run", liveUrl: null })],
    }),
  ]);
  assert.equal(parsed.issues[0].entries[0].type, "dry-run");
});

test("durationMs of 0 is kept", () => {
  assert.equal(
    parsedIndex([issue({ entries: [entry({ durationMs: 0 })] })]).issues[0].entries[0].durationMs,
    0,
  );
});

test("negative durationMs fails closed", () => {
  assert.equal(
    parsePublicReviewSnapshot(wrapper([issue({ entries: [entry({ durationMs: -1 })] })])).ok,
    false,
  );
});

test("latest status uses the last entry; a review verdict wins", () => {
  const reviewLast = [
    entry({ type: "implement", status: "completed", startedAt: "2026-11-10T16:00:00.000Z" }),
    entry({
      id: "rev",
      runId: "run-rev",
      type: "review",
      status: "completed",
      startedAt: "2026-11-10T17:00:00.000Z",
      verdict: "approve",
    }),
  ];
  assert.equal(latestStatus(reviewLast), "approve");
  assert.equal(
    latestStatus([entry({ type: "implement", status: "failed", verdict: null })]),
    "failed",
  );
  assert.equal(
    latestStatus([entry({ type: "review", status: "failed", verdict: null })]),
    "failed",
  );
  assert.equal(
    latestStatus([entry({ type: "implement", status: "running", durationMs: null })]),
    "running",
  );
  assert.equal(latestStatus([]), null);
});

test("latestEntry returns null on empty entries", () => {
  assert.equal(latestEntry([]), null);
});

test("summedDurationMs adds known step durations and ignores running nulls", () => {
  assert.equal(summedDurationMs([]), null);
  assert.equal(
    summedDurationMs([
      entry({ durationMs: 1_200_000 }),
      entry({ id: "impl", type: "implement", durationMs: 402_000 }),
      entry({ id: "run", type: "review", status: "running", durationMs: null }),
    ]),
    1_602_000,
  );
});

test("entryUpdatedAt uses endedAt for completed steps and startedAt while running", () => {
  assert.equal(
    entryUpdatedAt(entry({ status: "completed", endedAt: "2026-11-10T16:07:00.000Z" })),
    "2026-11-10T16:07:00.000Z",
  );
  assert.equal(
    entryUpdatedAt(entry({ status: "completed" })),
    "2026-11-10T16:00:00.000Z",
  );
  assert.equal(
    entryUpdatedAt(
      entry({ status: "running", durationMs: null, endedAt: "2026-11-10T16:07:00.000Z" }),
    ),
    "2026-11-10T16:00:00.000Z",
  );
});

test("latestEntry returns the later startedAt runId when they differ", () => {
  const last = latestEntry([
    entry({ runId: "run-early", startedAt: "2026-11-10T16:00:00.000Z" }),
    entry({
      id: "later",
      runId: "run-late",
      type: "implement",
      startedAt: "2026-11-10T17:00:00.000Z",
    }),
  ]);
  assert.equal(last?.runId, "run-late");
});

test("latestEntry keeps the first entry when startedAt ties", () => {
  const last = latestEntry([
    entry({ id: "first", runId: "run-first", startedAt: "2026-11-10T16:00:00.000Z" }),
    entry({
      id: "second",
      runId: "run-second",
      type: "implement",
      startedAt: "2026-11-10T16:00:00.000Z",
    }),
  ]);
  assert.equal(last?.id, "first");
  assert.equal(last?.runId, "run-first");
});

test("latestEntry uses one runId when plan and implement share it", () => {
  const last = latestEntry([
    entry({ id: "plan", type: "plan", startedAt: "2026-11-10T16:00:00.000Z" }),
    entry({
      id: "implement",
      type: "implement",
      startedAt: "2026-11-10T16:10:00.000Z",
    }),
  ]);
  assert.equal(last?.runId, "run-108-impl");
  assert.equal(last?.type, "implement");
});

test("entriesNewestFirst returns empty for no steps", () => {
  assert.deepEqual(entriesNewestFirst([]), []);
});

test("entriesNewestFirst keeps a single step", () => {
  const row = entry({ id: "only" });
  assert.deepEqual(
    entriesNewestFirst([row]).map((item) => item.id),
    ["only"],
  );
});

test("entriesNewestFirst puts running steps first", () => {
  assert.deepEqual(
    entriesNewestFirst([
      entry({ id: "done", status: "completed", endedAt: "2026-11-10T19:00:00.000Z" }),
      entry({
        id: "live",
        status: "running",
        startedAt: "2026-11-10T16:00:00.000Z",
        durationMs: null,
      }),
    ]).map((item) => item.id),
    ["live", "done"],
  );
});

test("entriesNewestFirst lists later entryUpdatedAt first", () => {
  assert.deepEqual(
    entriesNewestFirst([
      entry({ id: "early", startedAt: "2026-11-10T16:00:00.000Z", endedAt: "2026-11-10T16:10:00.000Z" }),
      entry({ id: "late", startedAt: "2026-11-10T17:00:00.000Z", endedAt: "2026-11-10T18:00:00.000Z" }),
    ]).map((item) => item.id),
    ["late", "early"],
  );
});

test("entriesNewestFirst prefers endedAt over an earlier startedAt", () => {
  assert.deepEqual(
    entriesNewestFirst([
      entry({
        id: "long",
        startedAt: "2026-11-10T16:00:00.000Z",
        endedAt: "2026-11-10T19:00:00.000Z",
      }),
      entry({
        id: "short",
        startedAt: "2026-11-10T17:00:00.000Z",
        endedAt: "2026-11-10T17:10:00.000Z",
      }),
    ]).map((item) => item.id),
    ["long", "short"],
  );
});

test("entriesNewestFirst keeps id descending when entryUpdatedAt ties", () => {
  assert.deepEqual(
    entriesNewestFirst([
      entry({ id: "a", startedAt: "2026-11-10T16:00:00.000Z" }),
      entry({ id: "z", startedAt: "2026-11-10T16:00:00.000Z" }),
    ]).map((item) => item.id),
    ["z", "a"],
  );
});

test("entriesNewestFirst does not mutate the input array", () => {
  const rows = [
    entry({ id: "early", startedAt: "2026-11-10T16:00:00.000Z" }),
    entry({ id: "late", startedAt: "2026-11-10T18:00:00.000Z" }),
  ];
  entriesNewestFirst(rows);
  assert.deepEqual(
    rows.map((item) => item.id),
    ["early", "late"],
  );
});

test("listIssues stays oldest-first; entriesNewestFirst of those rows is newest-first", async () => {
  const port = createFixtureReviewPort(
    wrapper([
      issue({
        entries: [
          entry({ id: "late", startedAt: "2026-11-10T18:00:00.000Z" }),
          entry({ id: "early", startedAt: "2026-11-10T16:00:00.000Z" }),
        ],
      }),
    ]),
  );
  const listed = await port.listIssues();
  assert.deepEqual(
    listed[0].entries.map((item) => item.id),
    ["early", "late"],
  );
  assert.deepEqual(
    entriesNewestFirst(listed[0].entries).map((item) => item.id),
    ["late", "early"],
  );
});

test("headlineOutcome prefers a review verdict over a later completed follow-up", () => {
  const outcome = headlineOutcome([
    entry({
      id: "review",
      type: "review",
      verdict: "approve",
      score: 9,
      startedAt: "2026-11-10T17:00:00.000Z",
      endedAt: "2026-11-10T17:20:00.000Z",
    }),
    entry({
      id: "improve",
      type: "improve",
      startedAt: "2026-11-10T18:00:00.000Z",
      endedAt: "2026-11-10T18:20:00.000Z",
    }),
  ]);
  assert.equal(outcome?.kind, "verdict");
  assert.equal(outcome?.verdict, "approve");
  assert.equal(outcome?.score, 9);
});

test("headlineOutcome returns running even when an older review exists", () => {
  const outcome = headlineOutcome([
    entry({
      id: "review",
      type: "review",
      verdict: "approve",
      score: 9,
      startedAt: "2026-11-10T17:00:00.000Z",
    }),
    entry({
      id: "live",
      type: "implement",
      status: "running",
      startedAt: "2026-11-10T18:00:00.000Z",
      durationMs: null,
    }),
  ]);
  assert.equal(outcome?.kind, "status");
  assert.equal(outcome?.status, "running");
});

test("headlineOutcome is null for completed work with no review", () => {
  assert.equal(headlineOutcome([entry({ type: "implement" })]), null);
});

test("headlineOutcome prefers a later failed step over an older review verdict", () => {
  const outcome = headlineOutcome([
    entry({
      id: "review",
      type: "review",
      verdict: "approve",
      score: 9,
      startedAt: "2026-11-10T17:00:00.000Z",
      endedAt: "2026-11-10T17:20:00.000Z",
    }),
    entry({
      id: "failed-later",
      type: "improve",
      status: "failed",
      startedAt: "2026-11-10T18:00:00.000Z",
      endedAt: "2026-11-10T18:20:00.000Z",
    }),
  ]);
  assert.equal(outcome?.kind, "status");
  assert.equal(outcome?.status, "failed");
});

test("headlineOutcome badges a failed step that finished after a later-started completed step", () => {
  const outcome = headlineOutcome([
    entry({
      id: "failed-late",
      type: "implement",
      status: "failed",
      startedAt: "2026-11-10T16:00:00.000Z",
      endedAt: "2026-11-10T19:00:00.000Z",
    }),
    entry({
      id: "done-later-start",
      type: "plan",
      startedAt: "2026-11-10T18:00:00.000Z",
      endedAt: "2026-11-10T18:10:00.000Z",
    }),
  ]);
  assert.equal(outcome?.kind, "status");
  assert.equal(outcome?.status, "failed");
});

test("latestFinishedEntry skips running steps and uses endedAt", () => {
  const finished = latestFinishedEntry([
    entry({
      id: "done",
      endedAt: "2026-11-10T17:00:00.000Z",
    }),
    entry({
      id: "live",
      status: "running",
      startedAt: "2026-11-10T18:00:00.000Z",
      durationMs: null,
    }),
  ]);
  assert.equal(finished?.id, "done");
  assert.equal(entryUpdatedAt(finished), "2026-11-10T17:00:00.000Z");
});

test("displayModelLabel shortens stored model ids", () => {
  assert.equal(displayModelLabel("cursor-grok-4.6-high"), "Grok 4.6");
  assert.equal(displayModelLabel("muse-wonder-1.0-high"), "Muse");
  assert.equal(displayModelLabel("claude-sonnet-5-5"), "Claude Sonnet");
  assert.equal(displayModelLabel("cursor-composer-2.5"), "");
  assert.equal(displayModelLabels(["cursor-grok-4.6-high", "cursor-grok-4.6-high"]), "Grok 4.6");
});

test("issue and unlinked run paths format /issues/:n/runs/:id", () => {
  assert.equal(issueRunPath(108, "run-108-impl"), "/issues/108/runs/run-108-impl");
  assert.equal(unlinkedRunPath(54, "run-54-review"), "/issues/pr/54/runs/run-54-review");
  assert.equal(issuePath(108), "/issues/108");
  assert.equal(unlinkedPrPath(54), "/issues/pr/54");
});

function writeSnapshot(issues, pullRequests, extra = {}) {
  const dir = mkdtempSync(join(tmpdir(), "public-issues-"));
  const path = join(dir, "public-reviews.json");
  writeFileSync(path, JSON.stringify(wrapper(issues, pullRequests, extra)));
  return path;
}

test("the fixture port lists only exportable copies and isolates mutations", async () => {
  const port = createFixtureReviewPort(
    wrapper([
      issue(),
      issue({ number: 99, visibility: "private", title: "hidden", pullRequests: [] }),
    ]),
  );
  const listed = await port.listIssues();
  assert.deepEqual(
    listed.map((row) => row.number),
    [108],
  );
  listed[0].title = "mutated";
  const again = await port.listIssues();
  assert.equal(again[0].title, "Ship the public issues section");
  assert.equal(await port.getIssue(99), null);
  assert.equal(await port.getRun(99, "run-108-impl"), null);
  const run = await port.getRun(108, "run-108-impl");
  assert.equal(run?.status, "completed");
});

test("the fixture test double is not a load error", async () => {
  const port = createFixtureReviewPort();
  assert.equal(await port.hasLoadError(), false);
  assert.deepEqual(await issueIndexRobotsFrom(port), undefined);
  const sitemap = await listIssueSitemapPathsFrom(port);
  assert.equal(sitemap[0], "/issues");
  assert.ok(sitemap.includes("/issues/108"));
});

test("a load-error index is noindex and still lists /issues on the sitemap", async () => {
  const port = createComposedReviewPort(
    { version: 1, kind: "public-github-runs", issues: [], pullRequests: [] },
    [],
    { loadError: true },
  );
  assert.equal(await port.hasLoadError(), true);
  assert.deepEqual(await issueIndexRobotsFrom(port), { index: false });
  assert.deepEqual(await listIssueSitemapPathsFrom(port), ["/issues"]);
});

test("the fixture test double covers linked, unlinked, running, and failed rows", async () => {
  const port = createFixtureReviewPort();
  const listed = await port.listIssues();
  const statuses = new Set(listed.map((row) => latestStatus(row.entries)));
  const states = new Set(listed.map((row) => row.state));
  assert.ok(listed.length >= 3);
  assert.ok(states.has("open"));
  assert.ok(states.has("closed"));
  assert.ok(statuses.has("approve") || statuses.has("completed"));
  assert.ok(statuses.has("running"));
  assert.ok(statuses.has("failed"));
  assert.ok(!listed.some((row) => row.number === 99));
  const unlinked = await port.listUnlinkedPullRequests();
  assert.ok(unlinked.some((row) => row.number === 54));
  assert.ok(!unlinked.some((row) => row.number === 50));
});

test("the snapshot port lists only exportable copies and isolates mutations", async () => {
  const path = writeSnapshot([
    issue(),
    issue({ number: 99, visibility: "private", title: "hidden", pullRequests: [] }),
  ]);
  const port = createSnapshotReviewPort(path);
  const listed = await port.listIssues();
  assert.deepEqual(
    listed.map((row) => row.number),
    [108],
  );
  listed[0].title = "mutated";
  const again = await port.listIssues();
  assert.equal(again[0].title, "Ship the public issues section");
  assert.equal(await port.getIssue(99), null);
  assert.equal(await port.getRun(108, "missing"), null);
  const run = await port.getRun(108, "run-108-impl");
  assert.equal(run?.status, "completed");
});

test("an empty snapshot lists nothing and keeps static placeholders", async () => {
  const path = writeSnapshot([], []);
  const port = createSnapshotReviewPort(path);
  assert.deepEqual(await port.listIssues(), []);
  assert.deepEqual(await listIssueParamsFrom(port), [{ n: "0" }]);
  assert.deepEqual(await listIssueRunParamsFrom(port), [{ n: "0", id: "_placeholder" }]);
  assert.deepEqual(await listUnlinkedPrParamsFrom(port), [{ n: "0" }]);
  assert.deepEqual(await listUnlinkedRunParamsFrom(port), [{ n: "0", id: "_placeholder" }]);
  assert.deepEqual(await listReviewPrParamsFrom(port), [{ n: "0" }]);
  assert.deepEqual(await listReviewRunParamsFrom(port), [{ n: "0", id: "_placeholder" }]);
});

test("an empty snapshot still lists /issues on the sitemap and stays indexable", async () => {
  const standInPath = writeSnapshot([], []);
  const standIn = createSnapshotReviewPort(standInPath);
  assert.equal(await standIn.hasLoadError(), false);
  assert.deepEqual(await listIssueSitemapPathsFrom(standIn), ["/issues"]);
  assert.deepEqual(await listIssueSitemapPaths(standInPath), ["/issues"]);
  assert.equal(await issueIndexRobotsFrom(standIn), undefined);

  const generatedPath = writeSnapshot([], [], { kind: "generated-run-index" });
  const generated = createSnapshotReviewPort(generatedPath);
  assert.equal(await generated.hasLoadError(), false);
  assert.deepEqual(await listIssueSitemapPathsFrom(generated), ["/issues"]);
  assert.deepEqual(await listIssueSitemapPaths(generatedPath), ["/issues"]);
  assert.equal(await issueIndexRobotsFrom(generated), undefined);
});

test("an all-linked snapshot still emits unlinked static placeholders", async () => {
  const port = createSnapshotReviewPort(writeSnapshot([issue()], [pr()]));
  assert.deepEqual(await listUnlinkedPrParamsFrom(port), [{ n: "0" }]);
  assert.deepEqual(await listUnlinkedRunParamsFrom(port), [{ n: "0", id: "_placeholder" }]);
  assert.deepEqual(await listReviewPrParamsFrom(port), [{ n: "133" }]);
});

test("a malformed snapshot fails closed", () => {
  const dir = mkdtempSync(join(tmpdir(), "public-issues-bad-"));
  const invalidJson = join(dir, "invalid.json");
  writeFileSync(invalidJson, "{");
  assert.throws(() => createSnapshotReviewPort(invalidJson));
  const missing = join(dir, "missing.json");
  assert.throws(() => createSnapshotReviewPort(missing));
  const wrongVersion = writeSnapshot([issue()], [pr()], { version: 2 });
  assert.throws(() => createSnapshotReviewPort(wrongVersion));
});

test("same runId from plan and implement opens one run record", async () => {
  const port = createSnapshotReviewPort(
    writeSnapshot([
      issue({
        entries: [
          entry({ id: "plan", type: "plan", startedAt: "2026-11-10T16:00:00.000Z" }),
          entry({
            id: "implement",
            type: "implement",
            startedAt: "2026-11-10T16:10:00.000Z",
            durationMs: 1000,
          }),
        ],
      }),
    ]),
  );
  const run = await port.getRun(108, "run-108-impl");
  assert.equal(run?.runId, "run-108-impl");
  assert.equal(run?.entries.length, 2);
  assert.deepEqual(
    (await listIssueRunParamsFrom(port)).map((row) => row.id),
    ["run-108-impl"],
  );
});

test("redirect map: linked PR goes to the issue; unlinked PR uses /issues/pr/:n", async () => {
  const port = createSnapshotReviewPort(
    writeSnapshot(
      [issue()],
      [
        pr(),
        {
          number: 54,
          issueNumber: null,
          runIds: ["run-54-review"],
          entries: [
            entry({
              id: "54-review",
              runId: "run-54-review",
              type: "review",
              verdict: "comment",
              liveUrl: "https://example.test/live/run-54-review",
            }),
          ],
        },
      ],
    ),
  );
  assert.equal(redirectPathForPr(108, 133), "/issues/108");
  assert.equal(redirectPathForPr(null, 54), "/issues/pr/54");
  assert.equal(redirectPathForPrRun(108, 133, "run-108-impl"), "/issues/108/runs/run-108-impl");
  assert.equal(redirectPathForPrRun(null, 54, "run-54-review"), "/issues/pr/54/runs/run-54-review");
  assert.equal(linkedPrFallbackPath(108), "/issues/108");
  assert.equal(linkedPrFallbackPath(null), null);
  assert.equal(linkedPrRunFallbackPath(108, "run-108-impl"), "/issues/108/runs/run-108-impl");
  assert.equal(linkedPrRunFallbackPath(null, "run-108-impl"), null);
  assert.deepEqual(await listReviewPrParamsFrom(port), [{ n: "133" }, { n: "54" }]);
  assert.deepEqual(await listUnlinkedPrParamsFrom(port), [{ n: "54" }]);
  const redirects = await listReviewRedirectsFrom(port);
  assert.deepEqual(redirects[0], { from: "/reviews", to: "/issues" });
  assert.ok(redirects.some((row) => row.from === "/reviews/pr/133" && row.to === "/issues/108"));
  assert.ok(redirects.some((row) => row.from === "/reviews/pr/54" && row.to === "/issues/pr/54"));
  assert.ok(
    redirects.some(
      (row) =>
        row.from === "/reviews/pr/133/runs/run-108-impl" && row.to === "/issues/108/runs/run-108-impl",
    ),
  );
  assert.equal(await port.resolvePr(404), null);
});

test("retired review PR numbers keep redirect stubs to /issues", async () => {
  const port = createSnapshotReviewPort(writeSnapshot([], []));
  const redirects = await listReviewRedirectsFrom(port);
  for (const n of RETIRED_REVIEW_PR_NUMBERS) {
    assert.ok(
      redirects.some((row) => row.from === `/reviews/pr/${n}` && row.to === "/issues"),
      `missing stub for /reviews/pr/${n}`,
    );
  }
});

test("sitemap lists canonical /issues paths and omits /reviews/pr", async () => {
  const path = writeSnapshot(
    [issue()],
    [
      pr(),
      {
        number: 54,
        issueNumber: null,
        runIds: ["run-54-review"],
        entries: [entry({ id: "54-review", runId: "run-54-review", type: "review" })],
      },
    ],
    { kind: "generated-run-index" },
  );
  const sitemap = await listIssueSitemapPaths(path);
  assert.equal(sitemap[0], "/issues");
  assert.ok(sitemap.includes("/issues/108"));
  assert.equal(sitemap.includes("/issues/108/runs/run-108-impl"), false);
  assert.ok(sitemap.includes("/issues/pr/54"));
  assert.equal(sitemap.includes("/issues/pr/54/runs/run-54-review"), false);
  assert.ok(!sitemap.some((item) => item.startsWith("/reviews")));
});

test("DATA-SOURCES.md keeps the live-shaped parser contract and names the API sources", () => {
  const contract = readFileSync(join(reviewsRoot, "DATA-SOURCES.md"), "utf8");
  assert.equal(statSync(join(reviewsRoot, "DATA-SOURCES.md")).isFile(), true);
  assert.match(contract, /`opened_pr_url`/);
  assert.doesNotMatch(contract, /pr_url_opened/);
  assert.match(contract, /index parser does not invent a title/);
  assert.match(contract, /live mapper fallback/);
  assert.match(
    contract,
    /Each `pullRequests\[\]` object:[\s\S]*`visibility` \| Optional\. Same rule as issue rows/,
  );
  assert.match(contract, /Exception: `verdict_json` is any object or null/);
  assert.match(contract, /Index extras are dropped at parse/);
  assert.match(contract, /Live extras fail closed/);
  assert.match(contract, /do not rely on it for\s+unknown keys/);
  assert.match(contract, /Plan, implement, and dry-run: engine model/);
  assert.match(contract, /Required array \(may be empty\)/);
  assert.match(contract, /not merged into the issue timeline/);
  assert.match(contract, /HOSTED_LIVE_HREF_PREFIX/);
  assert.match(contract, /Allowlisted hosted-console href/);
  assert.match(contract, /GitHub REST/);
  assert.match(contract, /NEXT_PUBLIC_ZEDOS_RUNS_API_BASE/);
  assert.match(contract, /kind: public-github-runs/);
  assert.match(contract, /ErrorState with no Retry/);
  assert.match(contract, /10 pages × 100/);
  assert.match(contract, /Join order for the live merge/);
  assert.match(contract, /fills\s+each null field/);
  assert.doesNotMatch(contract, /later client refresh/);
  assert.doesNotMatch(contract, /ingest-public-reviews/);
  const featureIndex = readFileSync(join(reviewsRoot, "index.tsx"), "utf8");
  assert.match(featureIndex, /createSiteReviewPort\(\)/);
  assert.doesNotMatch(featureIndex, /createSnapshotReviewPort/);
  assert.doesNotMatch(featureIndex, /createFixtureReviewPort/);
  assert.equal(existsSync(join(reviewsRoot, "adapters/public-reviews.json")), false);
});

const INVENTORY_ISSUES = [
  66, 69, 70, 71, 73, 81, 82, 83, 87, 88, 89, 90, 91, 92, 93, 95, 96, 104, 105, 106, 107, 108, 109, 110, 137,
];
const INVENTORY_ISSUE_LIST_ORDER = [
  137, 110, 109, 108, 107, 106, 105, 104, 96, 95, 93, 92, 91, 90, 89, 88, 87, 83, 82, 81, 73, 71, 70, 69, 66,
];
const INVENTORY_UNLINKED_PRS = [45, 46, 47, 50, 51, 53, 54, 55, 64];
const INVENTORY_LINKED_PRS = [
  266, 267, 269, 270, 271, 273, 281, 282, 283, 287, 288, 289, 290, 291, 292, 295, 296, 304, 305, 306, 307, 308,
  309,
];

function inventoryIso(issueNumber, extraSeconds = 0) {
  return new Date(Date.UTC(2026, 10, 1, 12, 0, issueNumber * 10 + extraSeconds)).toISOString();
}

function inventoryLinkedPrs(n) {
  if (n === 93 || n === 110 || n === 137) return [];
  if (n === 66) return [266, 267];
  return [200 + n];
}

function inventoryImplEntries(n) {
  const runId = `run-${n}-impl`;
  const liveUrl = `${HOSTED_LIVE_HREF_PREFIX}${runId}`;
  const models = ["cursor-grok-4.6-high"];
  const plan = entry({
    id: `${n}-plan`,
    runId,
    type: "plan",
    status: "completed",
    startedAt: inventoryIso(n, 0),
    durationMs: 1000,
    models,
    liveUrl,
  });
  const implementStatus = n === 93 ? "failed" : n === 110 || n === 137 ? "running" : "completed";
  const implement = entry({
    id: `${n}-implement`,
    runId,
    type: "implement",
    status: implementStatus,
    startedAt: inventoryIso(n, 1),
    durationMs: implementStatus === "running" ? null : 2000,
    models,
    liveUrl,
  });
  if (n === 66) {
    return [
      plan,
      implement,
      entry({
        id: `${n}-review`,
        runId: `run-${n}-review`,
        type: "review",
        status: "completed",
        startedAt: inventoryIso(n, 2),
        durationMs: 3000,
        models: ["lens-model", "second-pass-model"],
        verdict: "approve",
        liveUrl: `${HOSTED_LIVE_HREF_PREFIX}run-${n}-review`,
      }),
    ];
  }
  if (n === 108) {
    return [
      entry({
        id: `${n}-improve`,
        runId: `run-${n}-improve`,
        type: "improve",
        status: "completed",
        startedAt: inventoryIso(n, 3),
        durationMs: 4000,
        models: ["improve-model"],
        liveUrl: `${HOSTED_LIVE_HREF_PREFIX}run-${n}-improve`,
      }),
      entry({
        id: `${n}-review`,
        runId: `run-${n}-review`,
        type: "review",
        status: "completed",
        startedAt: inventoryIso(n, 2),
        durationMs: 3000,
        models: ["lens-model", "second-pass-model"],
        verdict: "request-changes",
        liveUrl: `${HOSTED_LIVE_HREF_PREFIX}run-${n}-review`,
      }),
      implement,
      plan,
    ];
  }
  return [plan, implement];
}

function inventoryUnlinkedPr(n) {
  const type = n === 45 || n === 46 ? "dry-run" : n === 47 ? "improve" : "review";
  const runId = `run-${n}-${type === "dry-run" ? "dry" : type}`;
  return {
    number: n,
    issueNumber: null,
    runIds: [runId],
    entries: [
      entry({
        id: `${n}-${type}`,
        runId,
        type,
        status: "completed",
        startedAt: inventoryIso(n, 0),
        durationMs: 1000,
        models: type === "review" ? ["lens-model"] : ["cursor-grok-4.6-high"],
        verdict: type === "review" ? "comment" : null,
        liveUrl: `${HOSTED_LIVE_HREF_PREFIX}${runId}`,
      }),
    ],
  };
}

function inventoryLinkedPrRow(prNumber, issueNumber) {
  const runIds = [];
  for (const row of inventoryImplEntries(issueNumber)) {
    if (runIds.includes(row.runId)) continue;
    runIds.push(row.runId);
  }
  return { number: prNumber, issueNumber, runIds };
}

function inventoryIndex() {
  const issues = INVENTORY_ISSUES.map((n) => {
    const extras = {};
    if (n === 69) extras.visibility = null;
    if (n === 70) extras.visibility = "public";
    if (n === 108) extras.denseLive = { agents: [] };
    return issue({
      number: n,
      title: `Issue ${n} exportable run`,
      state: n === 110 || n === 137 ? "open" : "closed",
      pullRequests: inventoryLinkedPrs(n),
      lastRunAt: inventoryIso(n, n === 108 ? 3 : n === 66 ? 2 : 1),
      entries: inventoryImplEntries(n),
      ...extras,
    });
  });
  issues.push(
    issue({
      number: 99,
      title: "private issue",
      state: "open",
      pullRequests: [299],
      lastRunAt: inventoryIso(99, 1),
      visibility: "private",
      entries: inventoryImplEntries(99),
    }),
    issue({
      number: 1,
      title: "empty issue",
      state: "open",
      pullRequests: [],
      lastRunAt: inventoryIso(1, 0),
      entries: [],
    }),
  );
  const pullRequests = [];
  for (const n of INVENTORY_ISSUES) {
    for (const prNumber of inventoryLinkedPrs(n)) {
      pullRequests.push(inventoryLinkedPrRow(prNumber, n));
    }
  }
  for (const n of INVENTORY_UNLINKED_PRS) pullRequests.push(inventoryUnlinkedPr(n));
  pullRequests.push(
    { number: 299, issueNumber: 99, runIds: ["run-99-impl"] },
    {
      number: 999,
      issueNumber: null,
      runIds: ["run-999-review"],
      visibility: "private",
      entries: [entry({ id: "999-review", runId: "run-999-review", type: "review" })],
    },
  );
  return wrapper([...issues].reverse(), pullRequests, {
    kind: "generated-run-index",
    generatedAt: "2026-11-11T00:00:00.000Z",
    exporterNote: "out-of-repo",
  });
}

function writeInventorySnapshot() {
  const payload = inventoryIndex();
  const dir = mkdtempSync(join(tmpdir(), "public-issues-inventory-"));
  const path = join(dir, "public-reviews.json");
  writeFileSync(path, JSON.stringify(payload));
  return { path, payload, dest: join(dir, "dest.json") };
}

test("inventory-scale generated run index lists every exportable issue and drops private and empty rows", async () => {
  const { path } = writeInventorySnapshot();
  const port = createSnapshotReviewPort(path);
  const listed = await port.listIssues();
  assert.deepEqual(
    listed.map((row) => row.number),
    INVENTORY_ISSUE_LIST_ORDER,
  );
  assert.equal(listed.length, 25);
  assert.equal(listed.find((row) => row.number === 69)?.title, "Issue 69 exportable run");
  assert.equal(listed.find((row) => row.number === 70)?.state, "closed");
  assert.deepEqual(listed.find((row) => row.number === 66)?.pullRequests, [266, 267]);
  assert.equal(latestStatus(listed.find((row) => row.number === 66).entries), "approve");
  assert.equal(latestStatus(listed.find((row) => row.number === 93).entries), "failed");
  assert.equal(latestStatus(listed.find((row) => row.number === 110).entries), "running");
  assert.equal(latestStatus(listed.find((row) => row.number === 108).entries), "completed");
  assert.equal(await port.getIssue(99), null);
  assert.equal(await port.getIssue(1), null);
  assert.equal(await port.resolvePr(299), null);
});

test("inventory-scale timeline keeps plan and implement as two rows of one run", async () => {
  const { path } = writeInventorySnapshot();
  const port = createSnapshotReviewPort(path);
  const issue108 = await port.getIssue(108);
  assert.deepEqual(
    issue108.entries.map((row) => row.type),
    ["plan", "implement", "review", "improve"],
  );
  assert.deepEqual(
    entriesNewestFirst(issue108.entries).map((row) => row.type),
    ["improve", "review", "implement", "plan"],
  );
  assert.equal(issue108.entries[0].runId, "run-108-impl");
  assert.equal(issue108.entries[1].runId, "run-108-impl");
  assert.equal(issue108.entries[0].id, "108-plan");
  assert.equal(issue108.entries[1].id, "108-implement");
  assert.deepEqual([...issue108.entries[0].models], ["cursor-grok-4.6-high"]);
  assert.deepEqual([...issue108.entries[2].models], ["lens-model", "second-pass-model"]);
  assert.deepEqual([...issue108.entries[3].models], ["improve-model"]);
  const run = await port.getRun(108, "run-108-impl");
  assert.equal(run?.runId, "run-108-impl");
  assert.equal(run?.entries.length, 2);
  assert.equal(run?.liveUrl, `${HOSTED_LIVE_HREF_PREFIX}run-108-impl`);
  assert.equal(await port.getRun(108, "missing-run"), null);
});

test("inventory-scale unlinked pull requests stay reachable", async () => {
  const { path } = writeInventorySnapshot();
  const port = createSnapshotReviewPort(path);
  const unlinked = await port.listUnlinkedPullRequests();
  assert.deepEqual(
    unlinked.map((row) => row.number),
    INVENTORY_UNLINKED_PRS,
  );
  assert.equal((await port.getUnlinkedPullRequest(64))?.entries[0].type, "review");
  assert.equal((await port.getUnlinkedPullRequest(45))?.entries[0].type, "dry-run");
  assert.equal((await port.getUnlinkedPullRequest(47))?.entries[0].type, "improve");
  assert.equal((await port.getUnlinkedRun(64, "run-64-review"))?.runId, "run-64-review");
  assert.equal(await port.getUnlinkedPullRequest(999), null);
  assert.equal(await port.getUnlinkedRun(64, "missing-run"), null);
});

test("inventory-scale redirects cover every PR and run; unknown n is absent; retired stubs only when missing", async () => {
  const { path } = writeInventorySnapshot();
  const port = createSnapshotReviewPort(path);
  const redirects = await listReviewRedirectsFrom(port);
  assert.deepEqual(redirects[0], { from: "/reviews", to: "/issues" });
  const froms = redirects.map((row) => row.from);
  assert.ok(froms.includes("/reviews/pr/266"));
  assert.ok(froms.includes("/reviews/pr/308"));
  assert.ok(froms.includes("/reviews/pr/64"));
  assert.ok(froms.includes("/reviews/pr/45"));
  assert.equal(
    redirects.find((row) => row.from === "/reviews/pr/266")?.to,
    "/issues/66",
  );
  assert.equal(
    redirects.find((row) => row.from === "/reviews/pr/308")?.to,
    "/issues/108",
  );
  assert.equal(
    redirects.find((row) => row.from === "/reviews/pr/64")?.to,
    "/issues/pr/64",
  );
  assert.equal(
    redirects.find((row) => row.from === "/reviews/pr/308/runs/run-108-impl")?.to,
    "/issues/108/runs/run-108-impl",
  );
  assert.equal(
    redirects.find((row) => row.from === "/reviews/pr/64/runs/run-64-review")?.to,
    "/issues/pr/64/runs/run-64-review",
  );
  assert.equal(
    redirects.find((row) => row.from === "/reviews/pr/266/runs/run-66-impl")?.to,
    "/issues/66/runs/run-66-impl",
  );
  assert.equal(froms.includes("/reviews/pr/404"), false);
  assert.equal(froms.includes("/reviews/pr/299"), false);
  assert.equal(await port.resolvePr(404), null);
  assert.equal((await port.resolvePr(266))?.issueNumber, 66);
  assert.equal((await port.resolvePr(64))?.issueNumber, null);
  assert.equal(
    redirects.find((row) => row.from === "/reviews/pr/79")?.to,
    "/issues",
  );
  assert.equal(
    redirects.find((row) => row.from === "/reviews/pr/80")?.to,
    "/issues",
  );
  assert.equal(froms.includes("/reviews/pr/79/runs/run-108-impl"), false);
  const prLevel = redirects.filter((row) => /^\/reviews\/pr\/\d+$/.test(row.from));
  assert.equal(prLevel.length, INVENTORY_LINKED_PRS.length + INVENTORY_UNLINKED_PRS.length + 2);
  assert.equal(redirects.length, 71);
});

test("inventory-scale static params and sitemap stay on /issues paths", async () => {
  const { path } = writeInventorySnapshot();
  const port = createSnapshotReviewPort(path);
  assert.deepEqual(
    await listIssueParamsFrom(port),
    INVENTORY_ISSUE_LIST_ORDER.map((n) => ({ n: String(n) })),
  );
  const issueRuns = await listIssueRunParamsFrom(port);
  assert.ok(issueRuns.some((row) => row.n === "108" && row.id === "run-108-impl"));
  assert.equal(
    issueRuns.filter((row) => row.n === "108").length,
    3,
  );
  assert.equal(
    issueRuns.filter((row) => row.id === "run-108-impl").length,
    1,
  );
  assert.deepEqual(
    await listUnlinkedPrParamsFrom(port),
    INVENTORY_UNLINKED_PRS.map((n) => ({ n: String(n) })),
  );
  const reviewPrs = await listReviewPrParamsFrom(port);
  assert.equal(reviewPrs.length, INVENTORY_LINKED_PRS.length + INVENTORY_UNLINKED_PRS.length);
  assert.equal(
    reviewPrs.some((row) => row.n === "0"),
    false,
  );
  assert.equal(
    reviewPrs.some((row) => row.n === "79"),
    false,
  );
  assert.ok(reviewPrs.some((row) => row.n === "64"));
  assert.ok(reviewPrs.some((row) => row.n === "266"));
  const sitemap = await listIssueSitemapPathsFrom(port);
  assert.equal(sitemap[0], "/issues");
  assert.ok(sitemap.includes("/issues/108"));
  assert.equal(sitemap.includes("/issues/108/runs/run-108-impl"), false);
  assert.ok(sitemap.includes("/issues/93"));
  assert.ok(sitemap.includes("/issues/pr/64"));
  assert.equal(sitemap.includes("/issues/pr/64/runs/run-64-review"), false);
  assert.equal(sitemap.includes("/issues/99"), false);
  assert.equal(
    sitemap.some((item) => item.startsWith("/reviews")),
    false,
  );
});

test("inventory-scale generated run index stays under 200KB and extra keys are ignored", () => {
  const payload = inventoryIndex();
  const bytes = Buffer.byteLength(JSON.stringify(payload), "utf8");
  assert.ok(bytes < 200 * 1024, `payload is ${bytes} bytes`);
  const parsed = parsePublicReviewSnapshot(payload);
  assert.equal(parsed.ok, true, parsed.ok ? "" : parsed.error.message);
  assert.equal("generatedAt" in parsed.value, false);
  assert.equal("exporterNote" in parsed.value, false);
  assert.equal(parsed.value.kind, "generated-run-index");
  const issue108 = parsed.value.issues.find((row) => row.number === 108);
  assert.equal("denseLive" in issue108, false);
});

test("copy names empty list, timeline types, and the hosted-console placeholder", () => {
  assert.equal(reviewsCopy.list.empty, "No public runs yet");
  assert.equal(reviewsCopy.type.improve, "Follow-up after review");
  assert.equal(reviewsCopy.type.implement, "Implementation");
  assert.equal(reviewsCopy.verdict.approve, "Approved");
  assert.equal(reviewsCopy.verdict["request-changes"], "Changes requested");
  assert.equal(reviewsCopy.status.failed, "Didn't finish");
  assert.equal(reviewsCopy.issue.replaced, "Replaced by newer run");
  assert.equal(reviewsCopy.issue.failedReplaced, "Didn't finish — replaced by a later review");
  assert.equal(reviewsCopy.issue.viewLog, "View log");
  assert.equal(reviewsCopy.list.took, "Took");
  assert.equal(reviewsCopy.list.duration, "Duration");
  assert.equal(reviewsCopy.list.finished, "Finished");
  assert.equal(reviewsCopy.list.started, "Started");
  assert.equal(reviewsCopy.run.openLive, "Open the hosted live console (new tab)");
  assert.equal(reviewsCopy.unlinked.timelineEmpty, "No exportable runs on this pull request.");
  assert.equal(reviewsCopy.list.runs, "runs");
  assert.equal(
    reviewsCopy.unlinked.missing,
    "This URL is for unlinked pull requests. Linked PRs are listed on their issue page.",
  );
  assert.equal(reviewsCopy.metadata.reviewsMissing.title, "Review page not found");
  assert.equal(reviewsCopy.run.noLive, "No hosted live console URL is available for this run.");
  assert.equal(
    reviewsCopy.list.description,
    "Public work log of how each issue was planned, built, and reviewed.",
  );
  assert.equal(
    reviewsCopy.metadata.list.description,
    "Public work log of how each issue was planned, built, and reviewed.",
  );
  assert.equal(reviewsCopy.issue.timeline, "Timeline");
  assert.equal(reviewsCopy.list.githubIssue, "Issue");
  assert.equal(reviewsCopy.list.githubPull, "PR");
  assert.equal(
    reviewsCopy.loadError.description,
    "GitHub or the runs API did not answer. This page updates when the site is next published.",
  );
  assert.equal("retry" in reviewsCopy.loadError, false);
  assert.equal("openUnlinked" in reviewsCopy.list, false);
  assert.doesNotMatch(JSON.stringify(reviewsCopy), /Required actions/);
  assert.doesNotMatch(JSON.stringify(reviewsCopy), /\/live\//);
  assert.doesNotMatch(JSON.stringify(reviewsCopy), /ingest/);
  assert.doesNotMatch(JSON.stringify(reviewsCopy), /Preview look/);
  assert.doesNotMatch(JSON.stringify(reviewsCopy), /Dark preview/);
  assert.doesNotMatch(JSON.stringify(reviewsCopy), /Advanced token editor/);
  assert.doesNotMatch(JSON.stringify(reviewsCopy), /preview look/);
  assert.equal("appearance" in reviewsCopy, false);
});

test("parsePrNumber accepts decimal integers and rejects the rest", () => {
  assert.equal(parsePrNumber("71"), 71);
  assert.equal(parsePrNumber("0"), 0);
  assert.equal(parsePrNumber(""), null);
  assert.equal(parsePrNumber("-1"), null);
  assert.equal(parsePrNumber("12a"), null);
  assert.equal(parsePrNumber("1.2"), null);
  assert.equal(parsePrNumber("<script>"), null);
});

test("DATA-SOURCES.md documents share-URL keys and is not a merge field", () => {
  const snapshot = readFileSync(join(reviewsRoot, "DATA-SOURCES.md"), "utf8");
  assert.match(snapshot, /## Share URL \(site, not merge\)/);
  assert.match(snapshot, /The merge does not emit them/);
  assert.doesNotMatch(snapshot, /exporter/);
  assert.match(snapshot, /`identity`/);
  assert.match(snapshot, /`preview`/);
  assert.match(snapshot, /`theme`/);
  assert.match(snapshot, /`density`/);
  assert.doesNotMatch(snapshot, /Appearance panel/);
});

test("issues views drop the inline preview form and keep the shared frame", () => {
  const frame = readFileSync(join(reviewsRoot, "ui", "appearance-panel.tsx"), "utf8");
  const list = readFileSync(join(reviewsRoot, "ui", "review-list-view.tsx"), "utf8");
  const issue = readFileSync(join(reviewsRoot, "ui", "review-pr-view.tsx"), "utf8");
  const feature = readFileSync(join(reviewsRoot, "index.tsx"), "utf8");
  const fixture = readFileSync(join(reviewsRoot, "adapters", "fixture.ts"), "utf8");
  assert.doesNotMatch(fixture, /Appearance panel/);
  assert.doesNotMatch(fixture, /preview look/);
  for (const source of [frame, list, issue]) {
    assert.doesNotMatch(source, /ReviewAppearancePanel/);
    assert.doesNotMatch(source, /Preview look/);
    assert.doesNotMatch(source, /copy\.appearance/);
    assert.doesNotMatch(source, /\(panel\)/);
    assert.doesNotMatch(source, /\{panel\}/);
    assert.doesNotMatch(source, /history\.replaceState/);
    assert.doesNotMatch(source, /writeShareUrl/);
    assert.doesNotMatch(source, /mergeReviewShareUrl/);
    assert.match(source, /ReviewAppearanceFrame/);
  }
  assert.match(frame, /ThemeScope/);
  assert.match(frame, /width="full"/);
  assert.match(frame, /zk-header-max-width/);
  assert.match(frame, /parseReviewAppearance\(/);
  assert.match(frame, /window\.location\.search/);
  assert.match(frame, /hasReviewAppearanceQuery/);
  assert.match(frame, /identity=\{pin \? appearance\.identity : undefined\}/);
  assert.match(frame, /mode=\{pin \? appearance\.mode : undefined\}/);
  assert.match(frame, /identityPresets\[appearance\.identity\] \?\? identityPresets\.glass/);
  assert.doesNotMatch(feature, /identity testing ground/);
  assert.doesNotMatch(feature, /render-function children/);
  assert.match(feature, /share-URL pin/);
});

test("issue pages use generateStaticParams; review pages redirect", () => {
  const issuePage = readFileSync(join(issuesAppRoot, "[n]/page.tsx"), "utf8");
  const issueRun = readFileSync(join(issuesRunAppRoot, "[n]/runs/[id]/page.tsx"), "utf8");
  const unlinked = readFileSync(join(issuesAppRoot, "pr/[n]/page.tsx"), "utf8");
  const unlinkedRun = readFileSync(join(issuesAppRoot, "pr/[n]/runs/[id]/page.tsx"), "utf8");
  for (const source of [issuePage, issueRun, unlinked, unlinkedRun]) {
    assert.match(source, /generateStaticParams/);
    assert.match(source, /dynamicParams = false/);
  }
  const reviews = readFileSync(join(reviewsAppRoot, "page.tsx"), "utf8");
  const reviewPr = readFileSync(join(reviewsAppRoot, "pr/[n]/page.tsx"), "utf8");
  const reviewRun = readFileSync(join(reviewsAppRoot, "pr/[n]/runs/[id]/page.tsx"), "utf8");
  assert.match(reviews, /redirectReviewsIndex/);
  assert.match(reviewPr, /redirectReviewsPr/);
  assert.match(reviewRun, /redirectReviewsPrRun/);
  const feature = readFileSync(join(reviewsRoot, "index.tsx"), "utf8");
  assert.match(feature, /redirect\("/);
  assert.match(feature, /redirect\(redirectPathForPr/);
});

test("not-found segments use per-tree copy through one shared body", () => {
  const body = readFileSync(join(reviewsRoot, "ui/review-not-found-view.tsx"), "utf8");
  assert.match(body, /href="\/issues"/);
  const issue = readFileSync(join(issuesAppRoot, "not-found.tsx"), "utf8");
  assert.match(issue, /ReviewMissingFeature/);
  assert.match(issue, /metadata\.missing/);
  assert.match(issue, /issue\.missing/);
  const run = readFileSync(join(issuesRunAppRoot, "[n]/runs/not-found.tsx"), "utf8");
  assert.match(run, /ReviewMissingFeature/);
  assert.match(run, /run\.missing/);
  assert.doesNotMatch(run, /features\/reviews\/ui\/review-not-found-view/);
  const unlinked = readFileSync(join(issuesAppRoot, "pr/not-found.tsx"), "utf8");
  assert.match(unlinked, /ReviewMissingFeature/);
  assert.match(unlinked, /unlinked\.missing/);
  const unlinkedRun = readFileSync(join(issuesAppRoot, "pr/[n]/runs/not-found.tsx"), "utf8");
  assert.match(unlinkedRun, /ReviewMissingFeature/);
  assert.match(unlinkedRun, /run\.missing/);
  const reviews = readFileSync(join(reviewsAppRoot, "not-found.tsx"), "utf8");
  assert.match(reviews, /ReviewMissingFeature/);
  assert.match(reviews, /metadata\.reviewsMissing/);
  assert.doesNotMatch(reviews, /metadata\.missing\.title/);
});

test("load error view uses the route header and an All issues action, never reload", () => {
  const view = readFileSync(join(reviewsRoot, "ui/review-load-error-view.tsx"), "utf8");
  assert.match(view, /title=\{title\}/);
  assert.match(view, /description=\{description\}/);
  assert.match(view, /copy\.issue\.back/);
  assert.match(view, /href="\/issues"/);
  assert.match(view, /actions=/);
  assert.doesNotMatch(view, /window\.location\.reload/);
  assert.doesNotMatch(view, /copy\.list\.title/);
  const feature = readFileSync(join(reviewsRoot, "index.tsx"), "utf8");
  assert.match(exportedAsync(feature, "ReviewListFeature"), /reviewsCopy\.list\.title/);
  assert.match(exportedAsync(feature, "ReviewIssueFeature"), /reviewsCopy\.metadata\.issue\.title/);
  assert.match(exportedAsync(feature, "ReviewUnlinkedFeature"), /reviewsCopy\.metadata\.unlinked\.title/);
  assert.match(exportedAsync(feature, "ReviewIssueRunFeature"), /reviewsCopy\.metadata\.run\.title/);
  assert.match(exportedAsync(feature, "ReviewUnlinkedRunFeature"), /reviewsCopy\.metadata\.run\.title/);
  assert.match(exportedAsync(feature, "redirectReviewsPr"), /reviewsCopy\.metadata\.reviewsMissing\.title/);
  const missing = exportedAsync(feature, "ReviewMissingFeature");
  assert.match(missing, /reviewLoadErrorView\(\{\s*title,\s*description: body/);
});

test("list view shows a static load error and does not ship a sample notice", () => {
  const list = readFileSync(join(reviewsRoot, "ui/review-list-view.tsx"), "utf8");
  assert.doesNotMatch(list, /ReviewLoadErrorView/);
  assert.doesNotMatch(list, /window\.location\.reload/);
  assert.doesNotMatch(list, /ReviewSampleNotice/);
  assert.doesNotMatch(list, /showSampleNotice/);
  for (const file of ["review-pr-view.tsx", "review-timeline-row.tsx", "review-issue-detail.tsx"]) {
    const source = readFileSync(join(reviewsRoot, "ui", file), "utf8");
    assert.doesNotMatch(source, /ReviewSampleNotice/);
    assert.doesNotMatch(source, /showSampleNotice/);
  }
  const feature = readFileSync(join(reviewsRoot, "index.tsx"), "utf8");
  assert.match(feature, /hasLoadError/);
  assert.match(feature, /ReviewLoadErrorView/);
  assert.match(feature, /reviewLoadErrorView/);
  const listFeature = exportedAsync(feature, "ReviewListFeature");
  assert.match(listFeature, /reviewLoadErrorView\(/);
  assert.doesNotMatch(listFeature, /loadError=\{/);
  pinsLoadErrorBeforeNotFound(exportedAsync(feature, "ReviewIssueFeature"));
  pinsLoadErrorBeforeNotFound(exportedAsync(feature, "ReviewUnlinkedFeature"));
  pinsLoadErrorBeforeNotFound(exportedAsync(feature, "ReviewIssueRunFeature"));
  pinsLoadErrorBeforeNotFound(exportedAsync(feature, "ReviewUnlinkedRunFeature"));
  pinsLoadErrorBeforeNotFound(exportedAsync(feature, "redirectReviewsPr"));
  pinsLoadErrorBeforeNotFound(exportedAsync(feature, "redirectReviewsPrRun"));
  const missing = exportedAsync(feature, "ReviewMissingFeature");
  const loadErrorAt = missing.search(/reviewLoadErrorView\(/);
  const notFoundViewAt = missing.search(/ReviewNotFoundView/);
  assert.notEqual(loadErrorAt, -1);
  assert.notEqual(notFoundViewAt, -1);
  assert.ok(loadErrorAt < notFoundViewAt);
  assert.doesNotMatch(feature, /window\.location\.reload/);
  assert.doesNotMatch(feature, /isPublicStandIn/);
  assert.equal(existsSync(join(reviewsRoot, "ui/review-sample-notice.tsx")), false);
});

test("found /issues pages pass issuesIndexRobots", () => {
  const list = readFileSync(join(issuesAppRoot, "page.tsx"), "utf8");
  const issuePage = readFileSync(join(issuesAppRoot, "[n]/page.tsx"), "utf8");
  const issueRun = readFileSync(join(issuesRunAppRoot, "[n]/runs/[id]/page.tsx"), "utf8");
  const unlinked = readFileSync(join(issuesAppRoot, "pr/[n]/page.tsx"), "utf8");
  const unlinkedRun = readFileSync(join(issuesAppRoot, "pr/[n]/runs/[id]/page.tsx"), "utf8");
  for (const source of [list, issuePage, issueRun, unlinked, unlinkedRun]) {
    assert.match(source, /issuesIndexRobots/);
  }
});


test("list and timeline views read from issue records, not a PR console", () => {
  const list = readFileSync(join(reviewsRoot, "ui/review-list-view.tsx"), "utf8");
  const detail = readFileSync(join(reviewsRoot, "ui/review-issue-detail.tsx"), "utf8");
  const timeline = readFileSync(join(reviewsRoot, "ui/review-pr-view.tsx"), "utf8");
  assert.match(detail, /githubIssueHref/);
  assert.match(list, /copy\.list\.unlinkedTitle/);
  assert.doesNotMatch(list, /copy\.list\.openIssue/);
  assert.match(list, /copy\.type\[last\.type\]/);
  assert.match(list, /aria-label=\{copy\.list\.title\}/);
  assert.match(list, /SidebarNavGroup/);
  assert.match(list, /runCountLabel/);
  assert.match(timeline, /TimelineRow/);
  assert.match(timeline, /entry\.liveUrl/);
  assert.match(timeline, /aria-labelledby/);
  assert.match(timeline, /copy\.unlinked\.timelineEmpty/);
  assert.doesNotMatch(list, /ReviewConsole/);
  assert.doesNotMatch(detail, /ReviewConsole/);
  assert.doesNotMatch(timeline, /ReviewConsole/);
});

test("list is a master-detail workspace; GitHub links stay in the detail", () => {
  const list = readFileSync(join(reviewsRoot, "ui/review-list-view.tsx"), "utf8");
  const detail = readFileSync(join(reviewsRoot, "ui/review-issue-detail.tsx"), "utf8");
  const css = readFileSync(join(reviewsRoot, "ui/review-list.css"), "utf8");
  assert.match(list, /data-issues-workspace=""/);
  assert.match(list, /data-issues-aside=""/);
  assert.match(list, /data-issues-detail=""/);
  assert.match(list, /data-issues-row=""/);
  assert.doesNotMatch(list, /<details /);
  assert.doesNotMatch(list, /<summary /);
  assert.match(detail, /<Card>/);
  assert.match(detail, /CardHeader/);
  assert.match(detail, /<DetailPanel variant="grid"/);
  assert.match(detail, /entriesNewestFirst\(entries\)/);
  assert.match(list, /headlineOutcome/);
  assert.doesNotMatch(list, /min-h-target w-fit/);
  assert.doesNotMatch(list, /Accordion/);
  assert.doesNotMatch(list, /AppShell/);
  assert.doesNotMatch(list, /issueRunPath/);
  assert.doesNotMatch(list, /unlinkedRunPath/);
  assert.doesNotMatch(list, /unlinkedPrPath/);
  assert.doesNotMatch(list, /timelineHref/);
  assert.doesNotMatch(list, /timelineLabel/);
  assert.match(detail, /aria-label=\{copy\.issue\.timeline\}/);
  assert.match(detail, /githubIssueHref/);
  assert.match(detail, /githubPullHref/);
  assert.match(detail, /copy\.issue\.timelineEmpty/);
  assert.doesNotMatch(list, /copy\.list\.openUnlinked/);
  assert.doesNotMatch(list, /\/runs\/`/);
  assert.doesNotMatch(list, /\/runs\/\$\{/);
  assert.match(css, /data-issues-workspace/);
  assert.match(css, /min-width: 48rem/);
  assert.match(css, /100svh - var\(--zk-site-header-height\)/);
  assert.match(list, /SidebarNavItem/);
  assert.match(list, /StatusDot/);
  assert.match(list, /w-app-shell-sidebar/);
  assert.match(list, /p-app-shell-padding/);
  assert.match(list, /DrawerTrigger/);
  assert.match(list, /max-md:hidden/);
});

test("detail timelines keep port order and do not import entriesNewestFirst", () => {
  const timeline = readFileSync(join(reviewsRoot, "ui/review-pr-view.tsx"), "utf8");
  assert.doesNotMatch(timeline, /entriesNewestFirst/);
  assert.match(timeline, /<Timeline entries=\{issue\.entries\}/);
  assert.match(timeline, /<Timeline[\s\S]*entries=\{pullRequest\.entries\}/);
});

test("unlinked and timeline links take their accessible name from visible title text", () => {
  const list = readFileSync(join(reviewsRoot, "ui/review-list-view.tsx"), "utf8");
  const timeline = readFileSync(join(reviewsRoot, "ui/review-pr-view.tsx"), "utf8");
  const row = readFileSync(join(reviewsRoot, "ui/review-timeline-row.tsx"), "utf8");
  assert.match(list, /#\{entry\.number\}/);
  assert.doesNotMatch(list, /copy\.list\.openUnlinked/);
  assert.doesNotMatch(list, /<Link[^>]*aria-label/);
  assert.doesNotMatch(list, /<Button[^>]*aria-label/);
  assert.doesNotMatch(list, /<summary[^>]*aria-label/);
  assert.match(timeline, /href=\{entry\.liveUrl\}/);
  assert.match(row, /copy\.type\[entry\.type\]/);
  assert.doesNotMatch(timeline, /copy\.issue\.openRun/);
  assert.doesNotMatch(row, /aria-label/);
  assert.doesNotMatch(JSON.stringify(reviewsCopy), /openUnlinked|openRun/);
});

test("list and timeline rows use row padding, not section padding", () => {
  const list = readFileSync(join(reviewsRoot, "ui/review-list-view.tsx"), "utf8");
  const timeline = readFileSync(join(reviewsRoot, "ui/review-pr-view.tsx"), "utf8");
  const row = readFileSync(join(reviewsRoot, "ui/review-timeline-row.tsx"), "utf8");
  const frame = readFileSync(join(reviewsRoot, "ui/appearance-panel.tsx"), "utf8");
  assert.match(list, /SidebarNavItem/);
  assert.match(list, /md:w-app-shell-sidebar/);
  assert.match(row, /py-row/);
  assert.match(row, /max-md:flex-col max-md:items-start/);
  assert.match(row, /hit-target/);
  assert.doesNotMatch(row, /min-h-target/);
  assert.doesNotMatch(timeline, /max-md:flex-col/);
  assert.doesNotMatch(list, /py-section-sm/);
  assert.doesNotMatch(row, /py-section-sm/);
  assert.match(frame, /<Stack gap="lg">\{children\}<\/Stack>/);
  assert.doesNotMatch(frame, /children\(panel\)/);
});

test("list stays in the shared wide frame and uses kit console nav rows", () => {
  const list = readFileSync(join(reviewsRoot, "ui/review-list-view.tsx"), "utf8");
  const frame = readFileSync(join(reviewsRoot, "ui/appearance-panel.tsx"), "utf8");
  assert.doesNotMatch(list, /ReviewSampleNotice/);
  assert.match(list, /<ReviewAppearanceFrame layout=\{empty \? "page" : "workspace"\}>[\s\S]*PageHeader[\s\S]*EmptyState[\s\S]*<\/ReviewAppearanceFrame>/);
  assert.match(list, /copy\.list\.unlinkedTitle/);
  assert.match(list, /IssuesWorkspace/);
  assert.match(frame, /width="full"/);
  assert.match(frame, /zk-header-max-width/);
  assert.doesNotMatch(frame, /width="wide"/);
  assert.doesNotMatch(list, /MarketingSiteHeader|MobileHeader|pathname/);
  assert.doesNotMatch(frame, /pathname/);
  assert.equal([...list.matchAll(/<details /g)].length, 0);
  assert.match(list, /IssueListRow[\s\S]*StatusDot/);
  assert.match(list, /layout=\{empty \? "page" : "workspace"\}/);
  assert.match(list, /resolveIssueOpenId/);
  assert.match(list, /addEventListener\("hashchange"/);
  assert.doesNotMatch(list, /<Link[^>]*aria-label/);
  assert.doesNotMatch(list, /<Button[^>]*aria-label/);
});

test("timeline rows show score, superseded, and endedAt-aware UpdatedAgo", () => {
  const row = readFileSync(join(reviewsRoot, "ui/review-timeline-row.tsx"), "utf8");
  const list = readFileSync(join(reviewsRoot, "ui/review-list-view.tsx"), "utf8");
  assert.match(row, /score=\{entry\.score \?\? null\}/);
  assert.match(row, /entry\.superseded !== true/);
  assert.match(row, /copy\.issue\.replaced/);
  assert.match(row, /entryUpdatedAt\(entry\)/);
  assert.doesNotMatch(row, /new Date\(entry\.startedAt\)/);
  const detail = readFileSync(join(reviewsRoot, "ui/review-issue-detail.tsx"), "utf8");
  assert.match(detail, /summedDurationMs/);
  assert.match(detail, /formatDuration/);
  assert.doesNotMatch(list, /from "next\/link"/);
});

test("verdict and status tones live in one shared module", () => {
  const badges = readFileSync(join(reviewsRoot, "ui/review-badges.ts"), "utf8");
  assert.match(badges, /export const VERDICT_BADGE/);
  assert.match(badges, /export const STATUS_BADGE/);
  assert.match(badges, /running: "secondary"/);
  assert.doesNotMatch(badges, /STATUS_TONE/);
  const status = readFileSync(join(reviewsRoot, "ui/issue-status.tsx"), "utf8");
  assert.match(status, /from "\.\/review-badges"/);
  assert.match(status, /STATUS_BADGE/);
  assert.doesNotMatch(status, /StatusLabel/);
  for (const file of ["review-list-view.tsx", "review-timeline-row.tsx"]) {
    const source = readFileSync(join(reviewsRoot, "ui", file), "utf8");
    assert.match(source, /from "\.\/issue-status"/);
    assert.doesNotMatch(source, /const VERDICT_BADGE/);
    assert.doesNotMatch(source, /const STATUS_TONE/);
  }
  const prView = readFileSync(join(reviewsRoot, "ui/review-pr-view.tsx"), "utf8");
  assert.doesNotMatch(prView, /const VERDICT_BADGE/);
  assert.doesNotMatch(prView, /const STATUS_TONE/);
});

function liveItem(overrides = {}) {
  return {
    id: "main",
    name: "Main flow",
    kind: "main",
    engine: "test",
    engine_label: "test",
    model: "test-model",
    status: "done",
    duration_s: 12,
    tool_count: 2,
    message_count: 1,
    tokens_in: 10,
    tokens_out: 4,
    started_ms: 1_762_698_500_000,
    last_activity_ms: 1_762_698_600_000,
    entries: [
      { type: "message", text: "hello" },
      { type: "tool", tool: "read", label: "Read", status: "done", output_chars: 12 },
    ],
    prompt: "review this",
    final_text: "approve",
    ...overrides,
  };
}

function liveSample(overrides = {}) {
  return {
    visibility: "public",
    decision: {
      posted: true,
      must: [{ text: "Name empty states" }],
      notes: [{ text: "The list leads. The verdict is readable." }],
      dismissed: [],
      degraded: false,
      enforcement_reasons: [],
      first_pass: { verdict: "APPROVE", confidence_score: 8.6 },
      second_pass: { kept: 0, dropped: 0, adjusted: 0, confirmed_blockers: 0, status: "ran" },
      verdict: "APPROVE",
      confidence_score: 8.6,
      summary: "The public review section is ready to merge.",
    },
    run: {
      run_id: "run-71",
      pr: 71,
      sha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      status: "done",
      engine: "test",
      engine_label: "test",
      created_at: 1_762_698_600,
      server_now: 1_762_698_600,
      elapsed_s: 12,
      verdict: "APPROVE",
      confidence_score: 8.6,
      review_size: "full",
      issue_title: "Add a public review section",
    },
    items: [liveItem()],
    verdict_json: { verdict: "APPROVE", blocking: [], notes: [] },
    related: [],
    ...overrides,
  };
}

function liveWrapper(reviews, extra = {}) {
  return { version: 1, kind: "public-live-runs", reviews, ...extra };
}

function writeLiveSnapshot(reviews, extra = {}) {
  const dir = mkdtempSync(join(tmpdir(), "public-live-reviews-"));
  const path = join(dir, "public-reviews.json");
  writeFileSync(path, JSON.stringify(liveWrapper(reviews, extra)));
  return path;
}

const GITHUB_REVIEW_URL = "https://github.com/example/repo/pull/133#pullrequestreview-1";
const HOSTED_LIVE_URL = hostedLiveHref();

function liveMappedEntry(overrides = {}) {
  const index = liveRunsToIndex([liveSample(overrides)]);
  const linked = index.issues[0]?.entries[0];
  if (linked !== undefined) return { index, entry: linked };
  return { index, entry: index.pullRequests[0].entries[0] };
}

test("a GitHub review_url is not a hosted live console URL", () => {
  const { entry } = liveMappedEntry({
    run: { ...liveSample().run, review_url: GITHUB_REVIEW_URL },
  });
  assert.equal(entry.liveUrl, null);
});

test("hosted live_url is kept; http, token, userinfo, and home paths are dropped", () => {
  assert.equal(liveMappedEntry({ run: { ...liveSample().run, live_url: HOSTED_LIVE_URL } }).entry.liveUrl, HOSTED_LIVE_URL);
  assert.equal(liveMappedEntry({ run: { ...liveSample().run, live_url: "http://example.test/live/abc" } }).entry.liveUrl, null);
  assert.equal(
    liveMappedEntry({ run: { ...liveSample().run, live_url: "https://example.test/live/abc?token=secret" } }).entry
      .liveUrl,
    null,
  );
  assert.equal(
    liveMappedEntry({ run: { ...liveSample().run, live_url: "https://user:pass@example.test/live/abc" } }).entry.liveUrl,
    null,
  );
  assert.equal(
    liveMappedEntry({ run: { ...liveSample().run, live_url: "https://example.test/home/alice/live" } }).entry.liveUrl,
    null,
  );
});

test("live mode live maps to review; improve and implement keep their names", () => {
  assert.equal(liveMappedEntry({ run: { ...liveSample().run, mode: "live" } }).entry.type, "review");
  assert.equal(liveMappedEntry({ run: { ...liveSample().run, mode: "improve" } }).entry.type, "improve");
  assert.equal(liveMappedEntry({ run: { ...liveSample().run, mode: "implement" } }).entry.type, "implement");
});

test("a live row with issue 108 lists that issue and redirects the PR to it", async () => {
  const path = writeLiveSnapshot([
    liveSample({
      run: {
        ...liveSample().run,
        pr: 133,
        issue: 108,
        issue_title: "Ship the public issues section",
        live_url: HOSTED_LIVE_URL,
        review_url: GITHUB_REVIEW_URL,
      },
    }),
  ]);
  const port = createSnapshotReviewPort(path);
  const listed = await port.listIssues();
  assert.deepEqual(
    listed.map((row) => row.number),
    [108],
  );
  assert.equal(listed[0].title, "Ship the public issues section");
  assert.equal(listed[0].state, "open");
  assert.deepEqual(listed[0].pullRequests, [133]);
  const resolved = await port.resolvePr(133);
  assert.equal(resolved?.issueNumber, 108);
  const redirects = await listReviewRedirectsFrom(port);
  assert.ok(redirects.some((row) => row.from === "/reviews/pr/133" && row.to === "/issues/108"));
  assert.ok(
    redirects.some(
      (row) => row.from === "/reviews/pr/133/runs/run-71" && row.to === "/issues/108/runs/run-71",
    ),
  );
  const run = await port.getRun(108, "run-71");
  assert.ok(run && "items" in run);
  assert.equal(run.run.run_id, "run-71");
  assert.equal(run.run.live_url, HOSTED_LIVE_URL);
  assert.deepEqual(await port.listUnlinkedPullRequests(), []);
  assert.equal(await port.hasLoadError(), false);
});

test("a live row with issue null or omitted stays an unlinked PR", async () => {
  const omitted = writeLiveSnapshot([liveSample({ run: { ...liveSample().run, pr: 54 } })]);
  const omittedPort = createSnapshotReviewPort(omitted);
  assert.deepEqual(await omittedPort.listIssues(), []);
  assert.equal((await omittedPort.resolvePr(54))?.issueNumber, null);
  const omittedRedirects = await listReviewRedirectsFrom(omittedPort);
  assert.ok(omittedRedirects.some((row) => row.from === "/reviews/pr/54" && row.to === "/issues/pr/54"));

  const explicitNull = writeLiveSnapshot([
    liveSample({ run: { ...liveSample().run, pr: 55, issue: null } }),
  ]);
  const nullPort = createSnapshotReviewPort(explicitNull);
  assert.deepEqual(await nullPort.listIssues(), []);
  assert.equal((await nullPort.resolvePr(55))?.issueNumber, null);
  const nullRedirects = await listReviewRedirectsFrom(nullPort);
  assert.ok(nullRedirects.some((row) => row.from === "/reviews/pr/55" && row.to === "/issues/pr/55"));
});

test("a live row with an issue and no PR still appears on the issue list", () => {
  const index = liveRunsToIndex([
    liveSample({
      run: { ...liveSample().run, pr: null, issue: 93, issue_title: "Failed implement" },
    }),
  ]);
  assert.deepEqual(
    index.issues.map((row) => row.number),
    [93],
  );
  assert.deepEqual(index.issues[0].pullRequests, []);
  assert.deepEqual(index.pullRequests, []);
});

test("live issue and live_url parse; unknown live run keys still fail", () => {
  const accepted = parsePublicReviewSnapshot(
    liveWrapper([
      liveSample({
        run: { ...liveSample().run, issue: 108, live_url: HOSTED_LIVE_URL },
      }),
    ]),
  );
  assert.equal(accepted.ok, true, accepted.ok ? "" : accepted.error.message);
  assert.equal(accepted.value[0].run.issue, 108);
  assert.equal(accepted.value[0].run.live_url, HOSTED_LIVE_URL);

  const nulls = parsePublicReviewSnapshot(
    liveWrapper([liveSample({ run: { ...liveSample().run, issue: null, live_url: null } })]),
  );
  assert.equal(nulls.ok, true, nulls.ok ? "" : nulls.error.message);
  assert.equal(nulls.value[0].run.issue, null);
  assert.equal(nulls.value[0].run.live_url, null);

  assert.equal(
    parsePublicReviewSnapshot(
      liveWrapper([liveSample({ run: { ...liveSample().run, hosted_url: HOSTED_LIVE_URL } })]),
    ).ok,
    false,
  );
  assert.equal(
    parsePublicReviewSnapshot(liveWrapper([liveSample({ run: { ...liveSample().run, issue: "108" } })])).ok,
    false,
  );
});

test("opened_pr_url is accepted; pr_url_opened fails closed", () => {
  const opened = "https://example.test/pr/71";
  const accepted = parsePublicReviewSnapshot(
    liveWrapper([liveSample({ run: { ...liveSample().run, opened_pr_url: opened } })]),
  );
  assert.equal(accepted.ok, true, accepted.ok ? "" : accepted.error.message);
  assert.equal(accepted.value[0].run.opened_pr_url, opened);
  assert.equal(
    parsePublicReviewSnapshot(
      liveWrapper([liveSample({ run: { ...liveSample().run, pr_url_opened: opened } })]),
    ).ok,
    false,
  );
});

test("live mapper falls back to Issue #N when issue_title is empty; index parse requires title", () => {
  const empty = liveRunsToIndex([
    liveSample({ run: { ...liveSample().run, pr: 133, issue: 108, issue_title: "" } }),
  ]);
  assert.equal(empty.issues[0].title, "Issue #108");
  const omittedTitle = { ...liveSample().run, pr: 133, issue: 108 };
  delete omittedTitle.issue_title;
  const omitted = liveRunsToIndex([liveSample({ run: omittedTitle })]);
  assert.equal(omitted.issues[0].title, "Issue #108");
  const rest = issue();
  delete rest.title;
  assert.equal(parsePublicReviewSnapshot(wrapper([rest])).ok, false);
});

test("private and unknown live visibility never survive the public gate", () => {
  const privateRecord = liveSample({
    visibility: "private",
    run: { ...liveSample().run, pr: 99, issue_title: "secret review" },
  });
  const unknown = liveSample({
    visibility: "team",
    run: { ...liveSample().run, pr: 98, issue_title: "mistyped" },
  });
  const missing = liveSample({
    run: { ...liveSample().run, pr: 97, issue_title: "no flag" },
  });
  delete missing.visibility;
  const kept = toPublicReviews([privateRecord, unknown, missing, liveSample()]);
  assert.deepEqual(
    kept.map((record) => record.run.pr),
    [71],
  );
});

test("live secret-like keys, bearer tokens, and home paths do not survive the public gate", () => {
  const base = liveSample();
  const dirty = liveSample({
    token: "super-secret",
    decision: {
      ...base.decision,
      summary: "Bearer xyzTOKEN789._~+/=- lives in /home/bob/kit",
      notes: [{ text: "Call with Bearer abcDEF123._~+/=- from /home/alice/kit/token" }],
      must: [
        {
          text: "Authorization: Basic dXNlcjpwYXNz lives in /Users/alice/.config",
        },
      ],
    },
    items: [
      liveItem({
        entries: [
          {
            type: "tool",
            tool: "read",
            label: "Read",
            status: "done",
            output: "Bearer firstPassSecret._~+/=- in /home/carol/review",
            output_chars: 40,
          },
        ],
        prompt: "Authorization: Basic eHl6OnBhc3M from /Users/bob/.config",
        final_text: "Bearer leftoverPrompt._~+/=- in /home/dave/notes",
      }),
    ],
  });
  const [clean] = toPublicReviews([dirty]);
  assert.equal(clean.token, "[redacted]");
  assert.match(clean.decision.notes[0].text, /Bearer \[redacted\]/);
  assert.doesNotMatch(clean.decision.notes[0].text, /abcDEF123/);
  assert.match(clean.decision.notes[0].text, /\[path\]/);
  assert.doesNotMatch(clean.decision.notes[0].text, /\/home\/alice/);
  assert.match(clean.decision.must[0].text, /Basic \[redacted\]/);
  assert.doesNotMatch(clean.decision.must[0].text, /dXNlcjpwYXNz/);
  assert.doesNotMatch(clean.decision.must[0].text, /\/Users\/alice/);
  assert.match(clean.decision.summary, /Bearer \[redacted\]/);
  assert.doesNotMatch(clean.decision.summary, /xyzTOKEN789/);
  assert.doesNotMatch(clean.decision.summary, /\/home\/bob/);
  assert.equal(clean.items[0].prompt, "[redacted]");
  assert.equal(clean.items[0].final_text, "[redacted]");
  assert.match(clean.items[0].entries[0].output, /Bearer \[redacted\]/);
  assert.doesNotMatch(clean.items[0].entries[0].output, /firstPassSecret/);
  assert.doesNotMatch(clean.items[0].entries[0].output, /\/home\/carol/);
});

test("a payload that still has a home path or token is rejected", () => {
  assert.throws(() => assertPubliclySafe({ notes: "from /home/alice/kit" }));
  assert.throws(() => assertPubliclySafe({ notes: "Bearer abcDEF123._~+/=" }));
  assert.throws(() => assertPubliclySafe({ notes: "bearer abcDEF123._~+/=" }));
  assert.throws(() => assertPubliclySafe({ notes: String.raw`C:\Users\bob\token` }));
  assert.doesNotThrow(() => assertPubliclySafe({ notes: "Bearer [redacted] at [path]" }));
});

test("toPublicIndex fails closed when a home path survives scrub", () => {
  assert.throws(() => toPublicIndex(parsedIndex([issue({ title: "notes from /home/" })])));
});

test("zero-entry issues and unlinked PRs are dropped before the list", () => {
  const gated = toPublicIndex(
    parsedIndex(
      [issue({ number: 1, entries: [] }), issue()],
      [
        pr({ number: 10, issueNumber: null, runIds: [], entries: [] }),
        pr(),
      ],
    ),
  );
  assert.deepEqual(
    gated.issues.map((row) => row.number),
    [108],
  );
  assert.deepEqual(
    gated.pullRequests.map((row) => row.number),
    [133],
  );
});

test("a public live review is kept with its list fields", () => {
  const [kept] = toPublicReviews([liveSample()]);
  assert.equal(kept.visibility, "public");
  assert.equal(kept.run.verdict, "APPROVE");
  assert.equal(kept.run.confidence_score, 8.6);
  assert.equal(kept.run.status, "done");
  assert.equal(kept.run.sha, "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  assert.deepEqual(kept.related, []);
  assert.equal(kept.items[0].kind, "main");
});

test("a version-1 live snapshot parses its reviews", () => {
  const parsed = parsePublicReviewSnapshot(liveWrapper([liveSample()]));
  assert.equal(parsed.ok, true);
  assert.deepEqual(
    parsed.value.map((record) => record.run.pr),
    [71],
  );
  assert.equal(parsed.value[0].decision.verdict, "APPROVE");
});

test("an empty live snapshot is valid", () => {
  const parsed = parsePublicReviewSnapshot(liveWrapper([]));
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.value, []);
});

test("an unknown live snapshot kind is accepted when version is 1", () => {
  const parsed = parsePublicReviewSnapshot(liveWrapper([liveSample()], { kind: "redacted-export" }));
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value.length, 1);
});

test("version 2 live snapshots are rejected", () => {
  const parsed = parsePublicReviewSnapshot(liveWrapper([liveSample()], { version: 2 }));
  assert.equal(parsed.ok, false);
});

test("unknown keys on a live snapshot record are rejected", () => {
  const parsed = parsePublicReviewSnapshot(liveWrapper([{ ...liveSample(), apiKey: "x" }]));
  assert.equal(parsed.ok, false);
});

test("unknown keys on nested live snapshot objects are rejected", () => {
  const parsed = parsePublicReviewSnapshot(
    liveWrapper([liveSample({ run: { ...liveSample().run, token: "x" } })]),
  );
  assert.equal(parsed.ok, false);
  assert.equal(
    parsePublicReviewSnapshot(
      liveWrapper([
        liveSample({
          items: [liveItem({ entries: [{ type: "message", text: "x", token: "x" }] })],
        }),
      ]),
    ).ok,
    false,
  );
});

test("unknown keys on the live snapshot wrapper are rejected", () => {
  const parsed = parsePublicReviewSnapshot(liveWrapper([liveSample()], { token: "x" }));
  assert.equal(parsed.ok, false);
});

test("a live snapshot with a missing required field is rejected", () => {
  const rest = liveSample();
  delete rest.run;
  const parsed = parsePublicReviewSnapshot(liveWrapper([rest]));
  assert.equal(parsed.ok, false);
});

test("wrong types in a live snapshot are rejected", () => {
  assert.equal(
    parsePublicReviewSnapshot(liveWrapper([liveSample({ run: { ...liveSample().run, created_at: "71" } })])).ok,
    false,
  );
  assert.equal(parsePublicReviewSnapshot(null).ok, false);
  assert.equal(parsePublicReviewSnapshot([]).ok, false);
});

test("unknown visibility in a live snapshot is rejected", () => {
  assert.equal(parsePublicReviewSnapshot(liveWrapper([liveSample({ visibility: "team" })])).ok, false);
});

test("omitted live visibility is rejected at parse and dropped at the public gate", () => {
  const omitted = liveSample();
  delete omitted.visibility;
  assert.equal(parsePublicReviewSnapshot(liveWrapper([omitted])).ok, false);
  assert.deepEqual(toPublicReviews([omitted]).map((row) => row.run.pr), []);
});

test("private live visibility is kept by parse so the public gate can drop it", () => {
  const parsed = parsePublicReviewSnapshot(liveWrapper([liveSample({ visibility: "private" })]));
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value[0].visibility, "private");
});

test("an item without entries still parses", () => {
  const item = liveItem();
  delete item.entries;
  const parsed = parsePublicReviewSnapshot(liveWrapper([liveSample({ items: [item] })]));
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.value[0].items[0].entries, []);
});

test("verdict_json extra keys are accepted", () => {
  const parsed = parsePublicReviewSnapshot(
    liveWrapper([liveSample({ verdict_json: { verdict: "APPROVE", extra_flag: true, blocking: [] } })]),
  );
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value[0].verdict_json.extra_flag, true);
});

test("the live fixture port lists only public copies", async () => {
  const port = createFixtureReviewPort([
    liveSample(),
    liveSample({
      visibility: "private",
      run: { ...liveSample().run, pr: 99, issue_title: "hidden" },
    }),
  ]);
  const listed = await port.list();
  assert.deepEqual(
    listed.map((record) => record.run.pr),
    [71],
  );
  listed[0].run.issue_title = "mutated";
  const again = await port.list();
  assert.equal(again[0].run.issue_title, "Add a public review section");
  assert.equal(await port.getByPr(99), null);
  assert.equal(await port.getRun(99, "run-71"), null);
  const run = await port.getRun(71, "run-71");
  assert.equal(run?.run.status, "done");
});

test("the live fixture test double covers more than one verdict and run status", async () => {
  const listed = await createFixtureReviewPort().list();
  assert.ok(listed.length >= 2);
  const verdicts = new Set(listed.map((record) => record.run.verdict));
  const statuses = new Set(listed.map((record) => record.run.status));
  assert.ok(verdicts.size >= 2);
  assert.ok(statuses.has("done"));
  assert.ok(statuses.has("running") || statuses.has("error"));
  assert.ok(listed.every((record) => record.visibility === "public"));
  assert.ok(!listed.some((record) => record.run.pr === 99));
});

test("the live snapshot port lists only public copies and isolates mutations", async () => {
  const path = writeLiveSnapshot([
    liveSample(),
    liveSample({
      visibility: "private",
      run: { ...liveSample().run, pr: 99, issue_title: "hidden" },
    }),
  ]);
  const port = createSnapshotReviewPort(path);
  const listed = await port.list();
  assert.deepEqual(
    listed.map((record) => record.run.pr),
    [71],
  );
  listed[0].run.issue_title = "mutated";
  listed[0].items = [];
  const again = await port.list();
  assert.equal(again[0].run.issue_title, "Add a public review section");
  assert.equal(again[0].items[0].id, "main");
  assert.equal(await port.getByPr(99), null);
  assert.equal(await port.getRun(99, "run-71"), null);
  assert.equal(await port.getByPr(404), null);
  assert.equal(await port.getRun(71, "missing"), null);
  const run = await port.getRun(71, "run-71");
  assert.equal(run?.run.status, "done");
  assert.equal(run?.items[0].kind, "main");
});

test("an empty live snapshot lists nothing and keeps the /reviews helper root", async () => {
  const path = writeLiveSnapshot([]);
  const port = createSnapshotReviewPort(path);
  assert.deepEqual(await port.list(), []);
  assert.deepEqual(await listReviewPrParamsFrom(port), [{ n: "0" }]);
  assert.deepEqual(await listReviewRunParamsFrom(port), [{ n: "0", id: "_placeholder" }]);
  assert.deepEqual(await listUnlinkedPrParamsFrom(port), [{ n: "0" }]);
  assert.deepEqual(await listUnlinkedRunParamsFrom(port), [{ n: "0", id: "_placeholder" }]);
  assert.deepEqual(await listReviewSitemapPathsFrom(port), ["/reviews"]);
  assert.deepEqual(await listReviewSitemapPaths(path), ["/reviews"]);
});

test("a malformed live snapshot fails closed", () => {
  const dir = mkdtempSync(join(tmpdir(), "public-live-reviews-bad-"));
  const invalidJson = join(dir, "invalid.json");
  writeFileSync(invalidJson, "{");
  assert.throws(() => createSnapshotReviewPort(invalidJson));
  const missing = join(dir, "missing.json");
  assert.throws(() => createSnapshotReviewPort(missing));
  const wrongVersion = writeLiveSnapshot([liveSample()], { version: 2 });
  assert.throws(() => createSnapshotReviewPort(wrongVersion));
});

test("static params and live sitemap come from public snapshot records only", async () => {
  const path = writeLiveSnapshot([
    liveSample(),
    liveSample({
      run: { ...liveSample().run, run_id: "run-64-a", pr: 64, issue_title: "Presentation blockers" },
    }),
    liveSample({
      run: {
        ...liveSample().run,
        run_id: "run-64-b",
        pr: 64,
        created_at: 1_762_698_700,
        issue_title: "Presentation blockers",
      },
    }),
    liveSample({ visibility: "private", run: { ...liveSample().run, pr: 99 } }),
  ]);
  const port = createSnapshotReviewPort(path);
  assert.deepEqual(await listReviewPrParamsFrom(port), [{ n: "71" }, { n: "64" }]);
  assert.deepEqual(await listReviewRunParamsFrom(port), [
    { n: "71", id: "run-71" },
    { n: "64", id: "run-64-a" },
    { n: "64", id: "run-64-b" },
  ]);
  assert.deepEqual(await listReviewSitemapPathsFrom(port), [
    "/reviews",
    "/reviews/pr/71",
    "/reviews/pr/71/runs/run-71",
    "/reviews/pr/64",
    "/reviews/pr/64/runs/run-64-a",
    "/reviews/pr/64/runs/run-64-b",
  ]);
});

test("item titles go through the public scrubber", () => {
  const [clean] = toPublicReviews([
    liveSample({
      items: [liveItem({ name: "Call with Bearer abcDEF123._~+/=" })],
    }),
  ]);
  assert.match(clean.items[0].name, /Bearer \[redacted\]/);
  assert.doesNotMatch(clean.items[0].name, /abcDEF123/);
});



test("share URL merge keeps appearance query and hash together", () => {
  assert.equal(
    mergeReviewShareUrl({
      pathname: "/issues/108",
      search: "identity=volt&preview=dark",
      hash: "",
    }),
    "/issues/108?identity=volt&preview=dark",
  );
  assert.equal(
    mergeReviewShareUrl({ pathname: "/issues/108", search: "", hash: "" }),
    "/issues/108",
  );
});

test("appearance share write keeps the selection hash", () => {
  const src = readFileSync(join(reviewsRoot, "ui", "review-console-appearance.tsx"), "utf8");
  assert.match(src, /mergeReviewShareUrl/);
  assert.match(src, /window\.location\.hash/);
  assert.doesNotMatch(
    readFileSync(join(reviewsRoot, "ui", "appearance-panel.tsx"), "utf8"),
    /mergeReviewShareUrl/,
  );
});

test("live-backed issue runs mount AgentConsole; index-only runs redirect", () => {
  const consoleView = readFileSync(join(reviewsRoot, "ui/review-console-view.tsx"), "utf8");
  const feature = readFileSync(join(reviewsRoot, "index.tsx"), "utf8");
  const row = readFileSync(join(reviewsRoot, "ui/review-timeline-row.tsx"), "utf8");
  const layout = readFileSync(join(here, "../app/(run-console)/layout.tsx"), "utf8");
  const siteLayout = readFileSync(join(here, "../app/(site)/layout.tsx"), "utf8");
  assert.match(consoleView, /AgentConsole/);
  assert.match(feature, /toAgentConsole/);
  assert.match(feature, /ReviewConsoleView/);
  assert.match(feature, /runId=\{id\}/);
  assert.match(feature, /runRedirectTarget\(run\.liveUrl/);
  assert.doesNotMatch(feature, /from "@zedtech\/zedkit-ui"/);
  assert.doesNotMatch(feature, /ReviewRunView/);
  assert.doesNotMatch(feature, /UnlinkedRunView/);
  assert.equal(existsSync(join(reviewsRoot, "ui/review-run-view.tsx")), false);
  assert.match(row, /target="_blank"/);
  assert.match(row, /rel="noopener noreferrer"/);
  assert.doesNotMatch(row, /ReviewConsole/);
  assert.doesNotMatch(row, /AgentConsole/);
  assert.doesNotMatch(layout, /SiteLayout/);
  assert.match(layout, /<main id="main-content"/);
  assert.match(siteLayout, /SiteLayout/);
});

test("live console host calms finding surfaces without restyling the kit specimen", () => {
  const consoleView = readFileSync(join(reviewsRoot, "ui/review-console-view.tsx"), "utf8");
  const appearance = readFileSync(join(reviewsRoot, "ui/review-console-appearance.tsx"), "utf8");
  const panes = readFileSync(join(here, "../../../packages/ui/src/layout/agent-console-panes.tsx"), "utf8");
  const demo = readFileSync(join(here, "../components/demos/agent-console-demo.tsx"), "utf8");
  const cssPath = join(reviewsRoot, "ui/review-console-surfaces.css");
  const css = existsSync(cssPath) ? readFileSync(cssPath, "utf8") : "";
  const hostCalm = `${consoleView}\n${appearance}\n${css}`;

  assert.match(consoleView, /<AgentConsole/);
  assert.match(consoleView, /decision=\{decision\}/);
  assert.match(consoleView, /ReviewConsoleAppearanceFrame/);
  assert.match(consoleView, /<Heading level=\{1\}/);
  assert.match(consoleView, /copy\.run\.title/);
  assert.match(consoleView, /pane-shrink/);
  assert.match(consoleView, /min-h-floor/);
  assert.match(consoleView, /runId/);
  assert.match(appearance, /min-h-floor/);
  assert.match(appearance, /data-review-console/);
  assert.doesNotMatch(consoleView, /variant="glass"/);
  assert.doesNotMatch(consoleView, /hover-lift/);
  assert.doesNotMatch(consoleView, /IdentityLookForm/);
  assert.doesNotMatch(consoleView, /\bCard\b/);
  assert.doesNotMatch(consoleView, /data-surface="glass"/);
  assert.match(panes, /data-slot="agent-console-decision"/);
  assert.match(hostCalm, /data-slot=agent-console-decision|data-slot="agent-console-decision"/);
  assert.match(hostCalm, /shadow-none|box-shadow:\s*none/);
  assert.match(hostCalm, /bg-none|background-image:\s*none/);
  assert.match(hostCalm, /data-review-console/);
  assert.match(hostCalm, /overflow-wrap:\s*anywhere/);
  assert.doesNotMatch(hostCalm, /!important/);
  assert.doesNotMatch(hostCalm, /\[data-identity=["']glass["']\][\s\S]*box-shadow/);
  if (css) {
    assert.match(consoleView, /review-console-surfaces\.css/);
    assert.match(css, /\[data-slot=["']agent-console["']\]/);
    assert.doesNotMatch(css, /data-surface=["']glass["']/);
  }
  assert.doesNotMatch(demo, /review-console-surfaces/);
  assert.doesNotMatch(demo, /agent-console-decision/);
  const row = readFileSync(join(reviewsRoot, "ui/review-timeline-row.tsx"), "utf8");
  assert.doesNotMatch(row, /AgentConsole/);
});

test("index-only run URLs redirect to the hosted console or the issue page", async () => {
  assert.equal(runRedirectTarget(hostedLiveHref("run-108-impl"), "/issues/108"), hostedLiveHref("run-108-impl"));
  assert.equal(runRedirectTarget(null, "/issues/108"), "/issues/108");
  const port = createSnapshotReviewPort(
    writeSnapshot(
      [issue()],
      [
        pr(),
        {
          number: 54,
          issueNumber: null,
          runIds: ["run-54-review"],
          entries: [
            entry({
              id: "54-review",
              runId: "run-54-review",
              type: "review",
              verdict: "comment",
              liveUrl: null,
            }),
          ],
        },
      ],
    ),
  );
  const redirects = await listIssueRunRedirectsFrom(port);
  assert.ok(
    redirects.some(
      (row) => row.from === "/issues/108/runs/run-108-impl" && row.to === hostedLiveHref("run-108-impl"),
    ),
  );
  assert.ok(
    redirects.some((row) => row.from === "/issues/pr/54/runs/run-54-review" && row.to === "/issues/pr/54"),
  );
});

test("toAgentConsole keeps confidence on /10 and converts durations to milliseconds", () => {
  const mapped = toAgentConsole(
    liveSample({
      run: { ...liveSample().run, elapsed_s: 12, confidence_score: 8.6 },
      items: [liveItem({ duration_s: 12 })],
    }),
  );
  assert.equal(mapped.run.confidence, 8.6);
  assert.equal(mapped.decision?.confidence, 8.6);
  assert.equal(mapped.run.durationMs, 12_000);
  assert.equal(mapped.items[0].durationMs, 12_000);
  assert.equal(mapped.items[0].startedAt, 1_762_698_500_000);
  assert.equal(mapped.items[0].lastActivityAt, 1_762_698_600_000);
});

test("toAgentConsole maps tool, message, and reasoning entries and omits prompts", () => {
  const mapped = toAgentConsole(
    liveSample({
      items: [
        liveItem({
          id: "main",
          entries: [
            { type: "message", text: "hello", id: "m1" },
            { type: "tool", tool: "read", label: "Read file", status: "done", output: "ok", duration_ms: 4 },
            { type: "reasoning", text: "thinking", live: true },
            { type: "tool", tool: "write", output: null },
          ],
          prompt: "secret prompt",
          final_text: "secret final",
        }),
      ],
    }),
  );
  const entries = mapped.items[0].entries;
  assert.deepEqual(
    entries.map((entry) => entry.kind),
    ["message", "tool", "reasoning", "tool"],
  );
  assert.equal(entries[1].kind, "tool");
  assert.equal(entries[1].name, "Read file");
  assert.equal(entries[1].body, "ok");
  assert.equal(entries[3].kind, "tool");
  assert.equal(entries[3].name, "write");
  assert.equal(entries[3].body, undefined);
  assert.equal(entries[2].id, "main-2");
  const blob = JSON.stringify(mapped);
  assert.doesNotMatch(blob, /secret prompt/);
  assert.doesNotMatch(blob, /secret final/);
  assert.equal("prompt" in mapped.items[0], false);
  assert.equal("final_text" in mapped.items[0], false);
});

test("toAgentConsole maps first-pass findings from verdict_json and second_pass.blocks_merge", () => {
  const mapped = toAgentConsole(
    liveSample({
      decision: {
        ...liveSample().decision,
        first_pass: { verdict: "REQUEST_CHANGES", confidence_score: 7.2 },
        second_pass: { model: "docs-reviewer", blocks_merge: true, summary: "Block" },
        review_url: "javascript:alert(1)",
      },
      verdict_json: {
        blocking: [{ _disposition: "kept", text: "Keep this" }],
        notes: [{ _disposition: "downgraded", text: "Note this" }, { _disposition: null, text: "skip" }],
      },
    }),
  );
  assert.equal(mapped.decision?.firstPass?.verdict, "REQUEST_CHANGES");
  assert.equal(mapped.decision?.firstPass?.confidence, 7.2);
  assert.deepEqual(
    mapped.decision?.firstPass?.findings.map((finding) => finding.disposition),
    ["kept", "downgraded"],
  );
  assert.equal(mapped.decision?.secondPass?.blocksMerge, true);
  assert.equal(mapped.decision?.secondPass?.model, "docs-reviewer");
  assert.equal(mapped.decision?.postedReviewHref, "javascript:alert(1)");
});

test("toAgentConsole still folds first pass when findings are empty", () => {
  const mapped = toAgentConsole(liveSample());
  assert.equal(mapped.decision?.firstPass?.verdict, "APPROVE");
  assert.equal(mapped.decision?.firstPass?.confidence, 8.6);
  assert.deepEqual(mapped.decision?.firstPass?.findings, []);
});

test("toAgentConsole marks running items from live status and ignores live_url as a review href", () => {
  const mapped = toAgentConsole(
    liveSample({
      run: { ...liveSample().run, live_url: "https://example.test/live/abc", review_url: null },
      decision: { ...liveSample().decision, review_url: null },
      items: [
        liveItem({ status: "starting" }),
        liveItem({ id: "lens-1", status: "running" }),
        liveItem({ id: "done-1", status: "done" }),
      ],
    }),
  );
  assert.deepEqual(
    mapped.items.map((item) => item.running),
    [true, true, false],
  );
  assert.equal(mapped.run.postedReviewHref, null);
  assert.equal(mapped.decision?.postedReviewHref, null);
});

test("optional reviews on an index snapshot feed getRun for that run id", async () => {
  const recordedId = "20261111T065452Z-bc07a1a9";
  const live = liveSample({
    run: { ...liveSample().run, run_id: recordedId, pr: 133, issue: 108 },
  });
  const path = writeSnapshot(
    [
      issue({
        entries: [entry(), entry({ id: "108-recorded", runId: recordedId, type: "review", liveUrl: null })],
      }),
    ],
    [pr({ runIds: ["run-108-impl", recordedId] })],
    { reviews: [live] },
  );
  const port = createSnapshotReviewPort(path);
  const issues = await port.listIssues();
  assert.equal(issues[0]?.number, 108);
  const liveRun = await port.getRun(108, recordedId);
  assert.ok(liveRun && "items" in liveRun);
  assert.equal(liveRun.run.run_id, recordedId);
  const indexRun = await port.getRun(108, "run-108-impl");
  assert.equal(indexRun && "runId" in indexRun ? indexRun.runId : null, "run-108-impl");
  assert.equal(
    indexRun && "liveUrl" in indexRun ? indexRun.liveUrl : null,
    `${HOSTED_LIVE_HREF_PREFIX}run-108-impl`,
  );
  assert.equal(await port.getRun(99, recordedId), null);
  assert.equal(await port.getRun(133, recordedId), null);
});

test("invalid reviews on an index snapshot fail closed", () => {
  assert.throws(() => createSnapshotReviewPort(writeSnapshot([issue()], [pr()], { reviews: "nope" })));
});
