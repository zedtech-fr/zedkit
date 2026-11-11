import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_REVIEW_APPEARANCE,
  parseReviewAppearance,
  serializeReviewAppearance,
} from "../lib/review-appearance.ts";
import { createFixtureReviewPort } from "../features/reviews/adapters/fixture.ts";
import {
  createSnapshotReviewPort,
  listIssueSitemapPaths,
  listReviewSitemapPaths,
} from "../features/reviews/adapters/snapshot.ts";
import { reviewsCopy } from "../features/reviews/i18n/reviews-copy.ts";
import { latestStatus } from "../features/reviews/model/latest-status.ts";
import { parsePublicReviewSnapshot } from "../features/reviews/model/parse-snapshot.ts";
import { parsePrNumber } from "../features/reviews/model/pr-number.ts";
import {
  assertPubliclySafe,
  isExportableVisibility,
  sanitizeLiveUrl,
  toPublicIndex,
  toPublicReviews,
} from "../features/reviews/model/public-review.ts";
import {
  listIssueParamsFrom,
  listIssueRunParamsFrom,
  listIssueSitemapPathsFrom,
  listReviewPrParamsFrom,
  listReviewRedirectsFrom,
  listReviewRunParamsFrom,
  listReviewSitemapPathsFrom,
  listUnlinkedPrParamsFrom,
  redirectPathForPr,
  redirectPathForPrRun,
  RETIRED_REVIEW_PR_NUMBERS,
} from "../features/reviews/model/review-routes.ts";
import { toReviewRecord } from "../features/reviews/model/to-review-record.ts";
import { mergeReviewShareUrl } from "../features/reviews/model/selection.ts";

const here = dirname(fileURLToPath(import.meta.url));
const reviewsRoot = join(here, "../features/reviews");
const reviewsAppRoot = join(here, "../app/(site)/reviews");
const issuesAppRoot = join(here, "../app/(site)/issues");

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
    liveUrl: "https://example.test/live/run-108-impl",
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

test("public-repo visibility: missing, null, and public are exportable; only private is dropped", () => {
  assert.equal(isExportableVisibility(undefined), true);
  assert.equal(isExportableVisibility(null), true);
  assert.equal(isExportableVisibility("public"), true);
  assert.equal(isExportableVisibility("team"), true);
  assert.equal(isExportableVisibility("private"), false);
  const gated = toPublicIndex(
    parsedIndex([
      issue({ number: 99, visibility: "private", title: "secret" }),
      issue({ number: 98, visibility: "team", title: "unknown flag" }),
      issue({ number: 97, title: "no flag" }),
      issue({ number: 96, visibility: null, title: "null flag" }),
      issue({ number: 95, visibility: "public", title: "marked public" }),
    ]),
  );
  assert.deepEqual(
    gated.issues.map((row) => row.number),
    [98, 97, 96, 95],
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

test("liveUrl with a secret-like query is dropped; https URLs are kept", () => {
  assert.equal(sanitizeLiveUrl("https://example.test/live/abc"), "https://example.test/live/abc");
  assert.equal(sanitizeLiveUrl("http://example.test/live/abc"), null);
  assert.equal(sanitizeLiveUrl("https://example.test/live/abc?token=secret"), null);
  assert.equal(sanitizeLiveUrl("https://user:pass@example.test/live/abc"), null);
  assert.equal(sanitizeLiveUrl(null), null);
  const gated = toPublicIndex(
    parsedIndex([
      issue({
        entries: [
          entry({ liveUrl: "https://example.test/live/ok" }),
          entry({
            id: "secret-url",
            liveUrl: "https://example.test/live/no?token=abc",
          }),
        ],
      }),
    ]),
  );
  assert.equal(gated.issues[0].entries[0].liveUrl, "https://example.test/live/ok");
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
    latestStatus([entry({ type: "implement", status: "running", durationMs: null })]),
    "running",
  );
  assert.equal(latestStatus([]), null);
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

test("an empty snapshot lists nothing and keeps the sitemap root at /issues", async () => {
  const path = writeSnapshot([], []);
  const port = createSnapshotReviewPort(path);
  assert.deepEqual(await port.listIssues(), []);
  assert.deepEqual(await listIssueParamsFrom(port), []);
  assert.deepEqual(await listIssueRunParamsFrom(port), []);
  assert.deepEqual(await listIssueSitemapPathsFrom(port), ["/issues"]);
  assert.deepEqual(await listIssueSitemapPaths(path), ["/issues"]);
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
  );
  const sitemap = await listIssueSitemapPaths(path);
  assert.equal(sitemap[0], "/issues");
  assert.ok(sitemap.includes("/issues/108"));
  assert.ok(sitemap.includes("/issues/108/runs/run-108-impl"));
  assert.ok(sitemap.includes("/issues/pr/54"));
  assert.ok(sitemap.includes("/issues/pr/54/runs/run-54-review"));
  assert.ok(!sitemap.some((item) => item.startsWith("/reviews")));
});

test("the checked-in public snapshot is live-shaped, under 200KB, and sitemaps /issues", async () => {
  const listed = await createSnapshotReviewPort().list();
  assert.ok(listed.length >= 1);
  const row = listed.find((record) => record.run.run_id === "20261111T065452Z-bc07a1a9") ?? listed[0];
  assert.equal(row.visibility, "public");
  assert.equal(typeof row.run.pr, "number");
  assert.ok(String(row.run.sha ?? "").length > 0);
  assert.ok(row.run.engine_label.length > 0);
  assert.equal(typeof row.run.elapsed_s, "number");
  assert.ok(String(row.run.verdict ?? "").length > 0);
  assert.equal(typeof row.run.confidence_score, "number");
  const kinds = new Set(row.items.map((item) => item.kind));
  assert.ok(kinds.has("main"));
  assert.ok(row.decision);
  const unlinked = await createSnapshotReviewPort().listUnlinkedPullRequests();
  assert.ok(unlinked.length >= 1);
  for (const entry of unlinked) {
    for (const item of entry.entries) {
      assert.ok(item.liveUrl === null || item.liveUrl.startsWith("https:"));
    }
  }
  const bytes = statSync(join(reviewsRoot, "adapters/public-reviews.json")).size;
  assert.ok(bytes < 200 * 1024);
  const sitemap = await listIssueSitemapPaths();
  assert.equal(sitemap[0], "/issues");
  assert.ok(!sitemap.some((item) => item.startsWith("/reviews/pr/")));
  const featureIndex = readFileSync(join(reviewsRoot, "index.tsx"), "utf8");
  assert.match(featureIndex, /createSnapshotReviewPort\(\)/);
  assert.doesNotMatch(featureIndex, /createFixtureReviewPort/);
});

test("copy names empty list, timeline types, and the hosted-console placeholder", () => {
  assert.equal(
    reviewsCopy.list.empty,
    "Public issues will show up here when the first exportable run exists.",
  );
  assert.equal(reviewsCopy.type.improve, "Improve from review");
  assert.equal(reviewsCopy.run.openLive, "Open the hosted live console (new tab)");
  assert.equal(reviewsCopy.unlinked.timelineEmpty, "No exportable runs on this pull request.");
  assert.equal(reviewsCopy.metadata.reviewsMissing.title, "Review page not found");
  assert.equal(reviewsCopy.run.noLive, "No hosted live console URL is available for this run.");
  assert.doesNotMatch(JSON.stringify(reviewsCopy), /Required actions/);
  assert.doesNotMatch(JSON.stringify(reviewsCopy), /\/live\//);
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

test("appearance round-trips identity, dark preview, and compact density", () => {
  const appearance = { identity: "volt", mode: "dark", density: "compact" };
  const query = serializeReviewAppearance(appearance);
  assert.equal(query, "identity=volt&preview=dark&density=compact");
  assert.deepEqual(parseReviewAppearance(`?${query}`), appearance);
});

test("canonical form omits glass, light, and default density", () => {
  assert.equal(serializeReviewAppearance(DEFAULT_REVIEW_APPEARANCE), "");
  assert.deepEqual(parseReviewAppearance(""), DEFAULT_REVIEW_APPEARANCE);
  assert.deepEqual(parseReviewAppearance("identity=glass&preview=light&density=default"), DEFAULT_REVIEW_APPEARANCE);
  assert.equal(serializeReviewAppearance(parseReviewAppearance("identity=glass&preview=dark")), "preview=dark");
});

test("preview=dark and legacy theme=dark both parse as dark", () => {
  assert.equal(parseReviewAppearance("preview=dark").mode, "dark");
  assert.equal(parseReviewAppearance("theme=dark").mode, "dark");
});

test("unknown identity and hostile query values fall back without throwing", () => {
  assert.equal(parseReviewAppearance("identity=n-custom").identity, "glass");
  assert.equal(parseReviewAppearance("identity=<script>").identity, "glass");
  assert.equal(parseReviewAppearance("density=comfortable").density, "default");
  assert.equal(parseReviewAppearance("preview=DARK").mode, "light");
  assert.doesNotThrow(() => parseReviewAppearance(`identity=${"x".repeat(4000)}&preview=${"\0"}`));
  assert.deepEqual(parseReviewAppearance("identity=tide&bogus=1&density=compact"), {
    identity: "tide",
    mode: "light",
    density: "compact",
  });
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

test("appearance codec still ignores unknown keys including item", () => {
  assert.deepEqual(parseReviewAppearance("identity=volt&item=agent-review"), {
    identity: "volt",
    mode: "light",
    density: "default",
  });
  assert.equal(serializeReviewAppearance(parseReviewAppearance("identity=volt&item=agent-review")), "identity=volt");
});

test("appearance share write keeps the selection hash", () => {
  const src = readFileSync(join(reviewsRoot, "ui", "appearance-panel.tsx"), "utf8");
  assert.match(src, /mergeReviewShareUrl/);
  assert.match(src, /window\.location\.hash/);
});

test("issue pages use generateStaticParams; review pages redirect", () => {
  const issuePage = readFileSync(join(issuesAppRoot, "[n]/page.tsx"), "utf8");
  const issueRun = readFileSync(join(issuesAppRoot, "[n]/runs/[id]/page.tsx"), "utf8");
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
  assert.match(issue, /metadata\.missing/);
  assert.match(issue, /issue\.missing/);
  const run = readFileSync(join(issuesAppRoot, "[n]/runs/not-found.tsx"), "utf8");
  assert.match(run, /run\.missing/);
  const unlinked = readFileSync(join(issuesAppRoot, "pr/not-found.tsx"), "utf8");
  assert.match(unlinked, /unlinked\.missing/);
  const unlinkedRun = readFileSync(join(issuesAppRoot, "pr/[n]/runs/not-found.tsx"), "utf8");
  assert.match(unlinkedRun, /run\.missing/);
  const reviews = readFileSync(join(reviewsAppRoot, "not-found.tsx"), "utf8");
  assert.match(reviews, /metadata\.reviewsMissing/);
  assert.doesNotMatch(reviews, /metadata\.missing\.title/);
});

test("provisional run page links out and does not render a console", () => {
  const run = readFileSync(join(reviewsRoot, "ui/review-run-view.tsx"), "utf8");
  assert.match(run, /copy\.run\.openLive/);
  assert.match(run, /copy\.run\.noLive/);
  assert.match(run, /target="_blank"/);
  assert.doesNotMatch(run, /ReviewConsole/);
  assert.doesNotMatch(run, /reviewMainFlow/);
  assert.doesNotMatch(run, /ReviewAgentList/);
  assert.doesNotMatch(run, /<iframe/);
});

test("list and timeline views read from issue records, not a PR console", () => {
  const list = readFileSync(join(reviewsRoot, "ui/review-list-view.tsx"), "utf8");
  const timeline = readFileSync(join(reviewsRoot, "ui/review-pr-view.tsx"), "utf8");
  assert.match(list, /issuePath/);
  assert.match(list, /copy\.list\.unlinkedTitle/);
  assert.doesNotMatch(list, /copy\.list\.openIssue/);
  assert.match(list, /copy\.type\[last\.type\]/);
  assert.match(timeline, /copy\.type/);
  assert.match(timeline, /entry\.runId/);
  assert.match(timeline, /aria-labelledby/);
  assert.match(timeline, /copy\.unlinked\.timelineEmpty/);
  assert.doesNotMatch(list, /ReviewConsole/);
  assert.doesNotMatch(timeline, /ReviewConsole/);
});

test("verdict and status tones live in one shared module", () => {
  const badges = readFileSync(join(reviewsRoot, "ui/review-badges.ts"), "utf8");
  assert.match(badges, /export const VERDICT_BADGE/);
  assert.match(badges, /export const STATUS_TONE/);
  assert.match(badges, /export const STATUS_BADGE/);
  const status = readFileSync(join(reviewsRoot, "ui/issue-status.tsx"), "utf8");
  assert.match(status, /from "\.\/review-badges"/);
  assert.match(status, /mark\.status === "running"/);
  assert.match(status, /STATUS_BADGE/);
  for (const file of ["review-list-view.tsx", "review-pr-view.tsx", "review-run-view.tsx"]) {
    const source = readFileSync(join(reviewsRoot, "ui", file), "utf8");
    assert.match(source, /from "\.\/issue-status"/);
    assert.doesNotMatch(source, /const VERDICT_BADGE/);
    assert.doesNotMatch(source, /const STATUS_TONE/);
  }
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
  assert.match(clean.items[0].prompt, /Basic \[redacted\]/);
  assert.doesNotMatch(clean.items[0].prompt, /eHl6OnBhc3M/);
  assert.doesNotMatch(clean.items[0].prompt, /\/Users\/bob/);
  assert.match(clean.items[0].entries[0].output, /Bearer \[redacted\]/);
  assert.doesNotMatch(clean.items[0].entries[0].output, /firstPassSecret/);
  assert.doesNotMatch(clean.items[0].entries[0].output, /\/home\/carol/);
});

test("a payload that still has a home path or token is rejected", () => {
  assert.throws(() => assertPubliclySafe({ notes: "from /home/alice/kit" }));
  assert.throws(() => assertPubliclySafe({ notes: "Bearer abcDEF123._~+/=" }));
  assert.throws(() => assertPubliclySafe({ notes: String.raw`C:\Users\bob\token` }));
  assert.doesNotThrow(() => assertPubliclySafe({ notes: "Bearer [redacted] at [path]" }));
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
  assert.deepEqual(await listReviewPrParamsFrom(port), []);
  assert.deepEqual(await listReviewRunParamsFrom(port), []);
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

test("the temporary mapper turns live rows into the current view-model", () => {
  const live = liveSample({
    decision: {
      ...liveSample().decision,
      verdict: "REQUEST_CHANGES",
      confidence_score: 7.2,
      must: [{ text: "Fix the link" }],
    },
    run: { ...liveSample().run, status: "completed", verdict: "REQUEST_CHANGES", sha: "abc" },
    verdict_json: {
      blocking: [{ _disposition: "kept", text: "Keep this" }],
      notes: [{ _disposition: "downgraded", text: "Note this" }],
    },
    items: [
      liveItem({ id: "main", kind: "main", name: "Main flow", status: "ran" }),
      liveItem({ id: "lens-1", kind: "lens", name: "code", status: "done" }),
    ],
  });
  const record = toReviewRecord(live);
  assert.equal(record.number, 71);
  assert.equal(record.verdict, "request-changes");
  assert.equal(record.confidence, 72);
  assert.equal(record.status, "done");
  assert.equal(record.headSha, "abc");
  assert.equal(record.prState, "open");
  assert.deepEqual(
    record.actions.map((action) => action.title),
    ["Fix the link"],
  );
  assert.deepEqual(
    record.findings.map((finding) => finding.disposition),
    ["kept", "downgraded"],
  );
  assert.equal(record.runs[0].id, "run-71");
  assert.deepEqual(
    record.runs[0].items?.map((item) => item.kind),
    ["flow", "agent"],
  );
});

test("the recorded snapshot maps must-change and kept first-pass findings", async () => {
  const lives = await createSnapshotReviewPort().list();
  const live = lives[0];
  assert.ok(live);
  const record = toReviewRecord(live, lives);
  assert.ok(record.actions.length > 0);
  assert.ok(record.findings.some((finding) => finding.disposition === "kept"));
  assert.ok(record.firstPass);
});
