import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
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
  listReviewSitemapPaths,
} from "../features/reviews/adapters/snapshot.ts";
import { reviewsCopy } from "../features/reviews/i18n/reviews-copy.ts";
import { filterReviewList } from "../features/reviews/model/list-filter.ts";
import { reviewMainFlow } from "../features/reviews/model/main-flow.ts";
import { parsePublicReviewSnapshot } from "../features/reviews/model/parse-snapshot.ts";
import { parsePrNumber } from "../features/reviews/model/pr-number.ts";
import { toPublicReviews } from "../features/reviews/model/public-review.ts";
import {
  listReviewPrParamsFrom,
  listReviewRunParamsFrom,
  listReviewSitemapPathsFrom,
} from "../features/reviews/model/review-routes.ts";
import {
  latestReviewRun,
  mergeReviewShareUrl,
  parseReviewSelection,
  reviewConsoleItems,
  selectionHash,
} from "../features/reviews/model/selection.ts";

const FEATURE = join(dirname(fileURLToPath(import.meta.url)), "..", "features", "reviews");

const here = dirname(fileURLToPath(import.meta.url));
const reviewsRoot = join(here, "../features/reviews");
const reviewsAppRoot = join(here, "../app/(site)/reviews");

function sample(overrides = {}) {
  return {
    number: 71,
    title: "Add a public review section",
    verdict: "approve",
    confidence: 86,
    status: "done",
    headSha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    lastRunAt: "2026-11-09T15:00:00.000Z",
    prState: "open",
    visibility: "public",
    notes: "The list leads. The verdict is readable.",
    summary: "The public review section is ready to merge.",
    evidence: "",
    actions: [{ title: "Name empty states", detail: "The list still needs a next click." }],
    findings: [],
    runs: [{ id: "run-71", status: "done", startedAt: "2026-11-09T14:50:00.000Z", agents: [] }],
    ...overrides,
  };
}

function wrapper(reviews, extra = {}) {
  return { version: 1, kind: "public-stand-in", reviews, ...extra };
}

test("private and unknown visibility never survive the public gate", () => {
  const privateRecord = sample({ number: 99, visibility: "private", title: "secret review" });
  const unknown = sample({ number: 98, visibility: "team", title: "mistyped" });
  const missing = sample({ number: 97, title: "no flag", visibility: undefined });
  const kept = toPublicReviews([privateRecord, unknown, missing, sample()]);
  assert.deepEqual(
    kept.map((record) => record.number),
    [71],
  );
});

test("secret-like keys, bearer tokens, and home paths do not survive the public gate", () => {
  const dirty = sample({
    notes: "Call with Bearer abcDEF123._~+/=- from /home/alice/kit/token",
    summary: "Bearer xyzTOKEN789._~+/=- lives in /home/bob/kit",
    evidence: "Authorization: Basic eHl6OnBhc3M from /Users/bob/.config",
    token: "super-secret",
    actions: [
      {
        title: "Drop the key",
        detail: "Authorization: Basic dXNlcjpwYXNz lives in /Users/alice/.config",
      },
    ],
    firstPass: {
      findings: [
        {
          title: "Drop the first-pass secret",
          detail: "Bearer firstPassSecret._~+/=- in /home/carol/review",
          disposition: "kept",
        },
      ],
    },
  });
  const [clean] = toPublicReviews([dirty]);
  assert.equal(clean.token, "[redacted]");
  assert.match(clean.notes, /Bearer \[redacted\]/);
  assert.doesNotMatch(clean.notes, /abcDEF123/);
  assert.match(clean.notes, /\[path\]/);
  assert.doesNotMatch(clean.notes, /\/home\/alice/);
  assert.match(clean.actions[0].detail, /Basic \[redacted\]/);
  assert.doesNotMatch(clean.actions[0].detail, /dXNlcjpwYXNz/);
  assert.doesNotMatch(clean.actions[0].detail, /\/Users\/alice/);
  assert.match(clean.summary, /Bearer \[redacted\]/);
  assert.doesNotMatch(clean.summary, /xyzTOKEN789/);
  assert.doesNotMatch(clean.summary, /\/home\/bob/);
  assert.match(clean.evidence, /Basic \[redacted\]/);
  assert.doesNotMatch(clean.evidence, /eHl6OnBhc3M/);
  assert.doesNotMatch(clean.evidence, /\/Users\/bob/);
  assert.match(clean.firstPass.findings[0].detail, /Bearer \[redacted\]/);
  assert.doesNotMatch(clean.firstPass.findings[0].detail, /firstPassSecret/);
  assert.doesNotMatch(clean.firstPass.findings[0].detail, /\/home\/carol/);
});

test("a public review is kept with its list fields", () => {
  const [kept] = toPublicReviews([sample()]);
  assert.equal(kept.visibility, "public");
  assert.equal(kept.verdict, "approve");
  assert.equal(kept.confidence, 86);
  assert.equal(kept.status, "done");
  assert.equal(kept.headSha, "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  assert.equal(kept.prState, "open");
  assert.deepEqual(kept.findings, []);
  assert.deepEqual(kept.runs[0].agents, []);
});

test("a version-1 snapshot parses its reviews", () => {
  const parsed = parsePublicReviewSnapshot(wrapper([sample()]));
  assert.equal(parsed.ok, true);
  assert.deepEqual(
    parsed.value.map((record) => record.number),
    [71],
  );
  assert.equal(parsed.value[0].verdict, "approve");
});

test("an empty snapshot is valid", () => {
  const parsed = parsePublicReviewSnapshot(wrapper([]));
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.value, []);
});

test("an unknown snapshot kind is accepted when version is 1", () => {
  const parsed = parsePublicReviewSnapshot(wrapper([sample()], { kind: "redacted-export" }));
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value.length, 1);
});

test("version 2 snapshots are rejected", () => {
  const parsed = parsePublicReviewSnapshot(wrapper([sample()], { version: 2 }));
  assert.equal(parsed.ok, false);
});

test("unknown keys on a snapshot record are rejected", () => {
  const parsed = parsePublicReviewSnapshot(wrapper([{ ...sample(), apiKey: "x" }]));
  assert.equal(parsed.ok, false);
});

test("unknown keys on nested snapshot objects are rejected", () => {
  const parsed = parsePublicReviewSnapshot(
    wrapper([
      sample({
        findings: [{ id: "f1", summary: "x", disposition: "kept", token: "x" }],
      }),
    ]),
  );
  assert.equal(parsed.ok, false);
  assert.equal(
    parsePublicReviewSnapshot(
      wrapper([
        sample({
          runs: [
            {
              id: "run-71",
              status: "done",
              startedAt: "2026-11-09T14:50:00.000Z",
              agents: [],
              items: [{ id: "flow", kind: "flow", title: "Main flow", status: "done", token: "x" }],
            },
          ],
        }),
      ]),
    ).ok,
    false,
  );
});

test("unknown keys on the snapshot wrapper are rejected", () => {
  const parsed = parsePublicReviewSnapshot(wrapper([sample()], { token: "x" }));
  assert.equal(parsed.ok, false);
});

test("a snapshot with a missing required field is rejected", () => {
  const rest = sample();
  delete rest.notes;
  const parsed = parsePublicReviewSnapshot(wrapper([rest]));
  assert.equal(parsed.ok, false);
});

test("wrong types in a snapshot are rejected", () => {
  assert.equal(parsePublicReviewSnapshot(wrapper([sample({ number: "71" })])).ok, false);
  assert.equal(parsePublicReviewSnapshot(null).ok, false);
  assert.equal(parsePublicReviewSnapshot([]).ok, false);
});

test("unknown visibility in a snapshot is rejected", () => {
  assert.equal(parsePublicReviewSnapshot(wrapper([sample({ visibility: "team" })])).ok, false);
});

test("private visibility is kept by parse so the public gate can drop it", () => {
  const parsed = parsePublicReviewSnapshot(wrapper([sample({ number: 99, visibility: "private" })]));
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value[0].visibility, "private");
});

test("the fixture port lists only public copies", async () => {
  const port = createFixtureReviewPort([
    sample(),
    sample({ number: 99, visibility: "private", title: "hidden" }),
  ]);
  const listed = await port.list();
  assert.deepEqual(
    listed.map((record) => record.number),
    [71],
  );
  listed[0].title = "mutated";
  const again = await port.list();
  assert.equal(again[0].title, "Add a public review section");
  assert.equal(await port.getByPr(99), null);
  assert.equal(await port.getRun(99, "run-71"), null);
  const run = await port.getRun(71, "run-71");
  assert.equal(run?.status, "done");
});

test("the fixture test double covers open, merged, and more than one run status", async () => {
  const listed = await createFixtureReviewPort().list();
  assert.ok(listed.length >= 2);
  const states = new Set(listed.map((record) => record.prState));
  const verdicts = new Set(listed.map((record) => record.verdict));
  const statuses = new Set(listed.map((record) => record.status));
  assert.ok(states.has("open"));
  assert.ok(states.has("merged"));
  assert.ok(verdicts.size >= 2);
  assert.ok(statuses.has("done"));
  assert.ok(statuses.has("running") || statuses.has("error"));
  assert.ok(listed.every((record) => record.visibility === "public"));
  assert.ok(!listed.some((record) => record.number === 99));
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

test("list filter matches state, verdict, and search over title, number, and SHA", () => {
  const records = [
    sample(),
    sample({
      number: 42,
      title: "Tighten contrast on Press",
      verdict: "request-changes",
      prState: "merged",
      headSha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    }),
  ];
  assert.deepEqual(
    filterReviewList(records, { prState: "open" }).map((record) => record.number),
    [71],
  );
  assert.deepEqual(
    filterReviewList(records, { verdict: "request-changes" }).map((record) => record.number),
    [42],
  );
  assert.deepEqual(
    filterReviewList(records, { search: "contrast" }).map((record) => record.number),
    [42],
  );
  assert.deepEqual(
    filterReviewList(records, { search: "71" }).map((record) => record.number),
    [71],
  );
  assert.deepEqual(
    filterReviewList(records, { search: "bbbbbbb" }).map((record) => record.number),
    [42],
  );
  assert.deepEqual(filterReviewList(records, { prState: "open", verdict: "request-changes" }), []);
  assert.equal(filterReviewList(records, {}).length, 2);
});

function writeSnapshot(reviews, extra = {}) {
  const dir = mkdtempSync(join(tmpdir(), "public-reviews-"));
  const path = join(dir, "public-reviews.json");
  writeFileSync(path, JSON.stringify(wrapper(reviews, extra)));
  return path;
}

test("the snapshot port lists only public copies and isolates mutations", async () => {
  const path = writeSnapshot([
    sample(),
    sample({ number: 99, visibility: "private", title: "hidden" }),
  ]);
  const port = createSnapshotReviewPort(path);
  const listed = await port.list();
  assert.deepEqual(
    listed.map((record) => record.number),
    [71],
  );
  listed[0].title = "mutated";
  listed[0].findings = [{ id: "x", summary: "no", disposition: "kept" }];
  const again = await port.list();
  assert.equal(again[0].title, "Add a public review section");
  assert.deepEqual(again[0].findings, []);
  assert.equal(await port.getByPr(99), null);
  assert.equal(await port.getRun(99, "run-71"), null);
  assert.equal(await port.getByPr(404), null);
  assert.equal(await port.getRun(71, "missing"), null);
  const run = await port.getRun(71, "run-71");
  assert.equal(run?.status, "done");
  assert.deepEqual(run?.agents, []);
});

test("an empty snapshot lists nothing and keeps the sitemap root", async () => {
  const path = writeSnapshot([]);
  const port = createSnapshotReviewPort(path);
  assert.deepEqual(await port.list(), []);
  assert.deepEqual(await listReviewPrParamsFrom(port), []);
  assert.deepEqual(await listReviewRunParamsFrom(port), []);
  assert.deepEqual(await listReviewSitemapPathsFrom(port), ["/reviews"]);
  assert.deepEqual(await listReviewSitemapPaths(path), ["/reviews"]);
});

test("a malformed snapshot fails closed", () => {
  const dir = mkdtempSync(join(tmpdir(), "public-reviews-bad-"));
  const invalidJson = join(dir, "invalid.json");
  writeFileSync(invalidJson, "{");
  assert.throws(() => createSnapshotReviewPort(invalidJson));
  const missing = join(dir, "missing.json");
  assert.throws(() => createSnapshotReviewPort(missing));
  const wrongVersion = writeSnapshot([sample()], { version: 2 });
  assert.throws(() => createSnapshotReviewPort(wrongVersion));
});

test("static params and sitemap come from public snapshot records only", async () => {
  const path = writeSnapshot([
    sample(),
    sample({
      number: 64,
      title: "Presentation blockers",
      verdict: "request-changes",
      runs: [
        { id: "run-64-a", status: "done", startedAt: "2026-11-10T14:00:00.000Z", agents: [] },
        { id: "run-64-b", status: "done", startedAt: "2026-11-10T14:10:00.000Z", agents: [] },
      ],
    }),
    sample({ number: 99, visibility: "private" }),
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

test("the checked-in public snapshot is dense enough for identity testing", async () => {
  const listed = await createSnapshotReviewPort().list();
  assert.ok(listed.length >= 3);
  const verdicts = new Set(listed.map((record) => record.verdict));
  assert.ok(verdicts.has("approve"));
  assert.ok(verdicts.has("request-changes"));
  const superseded = listed.some(
    (record) =>
      record.runs.length >= 2 && record.findings.some((finding) => finding.disposition !== "kept"),
  );
  assert.ok(superseded);
  const shas = listed.map((record) => record.headSha.toLowerCase());
  assert.ok(shas.every((sha) => sha.length === 40));
  assert.ok(shas.every((sha) => !/c0ffee|bada55|deface/.test(sha)));
  assert.ok(listed.every((record) => record.visibility === "public"));
  assert.ok(!listed.some((record) => record.number === 99));
  assert.ok(
    listed.every((record) =>
      record.runs.every((run) => (run.items ?? []).some((item) => item.kind === "flow")),
    ),
  );
  assert.ok(
    listed.some((record) =>
      record.runs.some((run) => (run.items ?? []).some((item) => item.kind === "agent")),
    ),
  );
  const params = await listReviewPrParamsFrom(createSnapshotReviewPort());
  assert.deepEqual(
    params.map((row) => row.n),
    listed.map((record) => String(record.number)),
  );
  const sitemap = await listReviewSitemapPaths();
  assert.equal(sitemap[0], "/reviews");
  for (const record of listed) {
    assert.ok(sitemap.includes(`/reviews/pr/${record.number}`));
    for (const run of record.runs) {
      assert.ok(sitemap.includes(`/reviews/pr/${record.number}/runs/${run.id}`));
    }
  }
});

test("copy has a Must change heading and no Required actions string", () => {
  assert.equal(reviewsCopy.pr.decision, "Decision");
  assert.equal(reviewsCopy.pr.mustChange, "Must change before merge");
  assert.equal(reviewsCopy.pr.firstPass, "First pass");
  assert.equal(reviewsCopy.pr.outdated, "Outdated");
  assert.equal(reviewsCopy.pr.confidenceUnit, "%");
  assert.equal(reviewsCopy.status.running, "Running at publish");
  assert.equal(reviewsCopy.disposition.kept, "Kept");
  assert.equal(reviewsCopy.disposition.downgraded, "Downgraded");
  assert.equal(reviewsCopy.disposition.dismissed, "Dismissed");
  assert.doesNotMatch(JSON.stringify(reviewsCopy), /Required actions/);
});

test("copy names findings, agent fields, and empty agents on this run", () => {
  assert.equal(reviewsCopy.pr.findings, "Findings");
  assert.equal(reviewsCopy.pr.findingsEmpty, "No findings on this review.");
  assert.equal(reviewsCopy.pr.agentDetailEmpty, "No agents on this run.");
  assert.equal(reviewsCopy.run.agents, "Agents");
  assert.equal(reviewsCopy.agent.id, "Id");
  assert.equal(reviewsCopy.agent.name, "Name");
  assert.equal(reviewsCopy.agent.kind, "Kind");
  assert.equal(reviewsCopy.agent.model, "Model");
});

test("empty actions omit Must change even on COMMENT and running reviews", () => {
  const flow = reviewMainFlow(sample({ verdict: "comment", status: "running", actions: [] }));
  assert.equal(flow.sections.includes("must-change"), false);
  assert.deepEqual(flow.blockers, []);
});

test("Must change follows remaining actions, not an approve verdict", () => {
  const flow = reviewMainFlow(
    sample({
      verdict: "approve",
      actions: [{ title: "Leftover blocker", detail: "Still listed." }],
    }),
  );
  assert.equal(flow.sections[0], "decision");
  assert.equal(flow.sections[1], "must-change");
  assert.deepEqual(
    flow.blockers.map((blocker) => blocker.title),
    ["Leftover blocker"],
  );
});

test("absent first pass and empty findings omit the first-pass section", () => {
  assert.equal(reviewMainFlow(sample()).firstPass, null);
  assert.equal(reviewMainFlow(sample()).sections.includes("first-pass"), false);
  const emptyFindings = reviewMainFlow(sample({ firstPass: { findings: [] } }));
  assert.equal(emptyFindings.firstPass, null);
  assert.equal(emptyFindings.sections.includes("first-pass"), false);
});

test("a superseded first pass is folded and keeps authored dispositions", () => {
  const flow = reviewMainFlow(
    sample({
      firstPass: {
        findings: [
          { title: "Keep contrast", detail: "Still blocks.", disposition: "kept" },
          { title: "Rename the empty state", detail: "Became a note.", disposition: "downgraded" },
          { title: "Invent a sidebar", detail: "Out of scope.", disposition: "dismissed" },
        ],
      },
    }),
  );
  assert.equal(flow.sections.includes("first-pass"), true);
  assert.ok(flow.firstPass);
  assert.deepEqual(
    flow.firstPass?.findings.map((finding) => finding.disposition),
    ["kept", "downgraded", "dismissed"],
  );
  assert.equal(flow.decision.verdict, "approve");
});

test("empty evidence is omitted; non-empty evidence follows notes", () => {
  assert.equal(reviewMainFlow(sample({ evidence: "" })).sections.includes("evidence"), false);
  assert.equal(reviewMainFlow(sample({ evidence: "   " })).evidence, null);
  const flow = reviewMainFlow(sample({ evidence: "Contrast log from the compact preview." }));
  const notesAt = flow.sections.indexOf("notes");
  assert.ok(notesAt >= 0);
  assert.equal(flow.sections[notesAt + 1], "evidence");
  assert.equal(flow.evidence, "Contrast log from the compact preview.");
});

test("production COMMENT running fixture has no Must change section", async () => {
  const listed = await createFixtureReviewPort().list();
  const comment = listed.find((record) => record.number === 18);
  assert.equal(comment?.verdict, "comment");
  assert.equal(comment?.status, "running");
  assert.deepEqual(comment?.actions, []);
  assert.equal(reviewMainFlow(comment).sections.includes("must-change"), false);
});

test("production APPROVE fixture has no Must change section", async () => {
  const listed = await createFixtureReviewPort().list();
  const approve = listed.find((record) => record.number === 71);
  assert.equal(approve?.verdict, "approve");
  assert.deepEqual(approve?.actions, []);
  const flow = reviewMainFlow(approve);
  assert.equal(flow.sections.includes("must-change"), false);
  assert.equal(flow.firstPass, null);
});

test("production REQUEST_CHANGES fixture lists blockers after the decision", async () => {
  const listed = await createFixtureReviewPort().list();
  const request = listed.find((record) => record.number === 42);
  assert.equal(request?.verdict, "request-changes");
  const flow = reviewMainFlow(request);
  assert.equal(flow.sections[0], "decision");
  assert.equal(flow.sections[1], "must-change");
  assert.deepEqual(
    flow.blockers.map((blocker) => blocker.title),
    ["Raise muted text on dark Press"],
  );
});

test("production superseded fixture labels mixed first-pass dispositions", async () => {
  const listed = await createFixtureReviewPort().list();
  const superseded = listed.find((record) => record.number === 83);
  assert.ok(superseded);
  const flow = reviewMainFlow(superseded);
  assert.equal(flow.sections[0], "decision");
  assert.equal(flow.sections[1], "must-change");
  assert.equal(flow.sections[2], "first-pass");
  assert.equal(flow.sections.includes("findings"), false);
  assert.deepEqual(flow.findings, []);
  assert.ok(flow.firstPass);
  assert.deepEqual(
    flow.firstPass?.findings.map((finding) => finding.disposition),
    ["kept", "downgraded", "dismissed"],
  );
});

test("empty reconciled findings omit the findings section", () => {
  const flow = reviewMainFlow(sample());
  assert.equal(flow.sections.includes("findings"), false);
  assert.deepEqual(flow.findings, []);
});

test("reconciled findings sit after must-change and keep authored dispositions", () => {
  const flow = reviewMainFlow(
    sample({
      findings: [
        { id: "dup", summary: "Keep contrast", disposition: "kept" },
        { id: "dup", summary: "Note the empty state", disposition: "downgraded" },
        { id: "skip", summary: "Skip a sidebar", disposition: "dismissed" },
      ],
      firstPass: {
        findings: [{ title: "Old", detail: "History", disposition: "kept" }],
      },
    }),
  );
  assert.deepEqual(flow.sections.slice(0, 4), ["decision", "must-change", "findings", "first-pass"]);
  assert.deepEqual(
    flow.findings.map((finding) => finding.disposition),
    ["kept", "downgraded", "dismissed"],
  );
  assert.deepEqual(
    flow.findings.map((finding) => finding.summary),
    ["Keep contrast", "Note the empty state", "Skip a sidebar"],
  );
  assert.deepEqual(
    flow.blockers.map((blocker) => blocker.title),
    ["Name empty states"],
  );
});

test("reconciled findings follow the decision when there are no blockers", () => {
  const flow = reviewMainFlow(
    sample({
      actions: [],
      findings: [{ id: "a", summary: "One leftover finding", disposition: "kept" }],
    }),
  );
  assert.equal(flow.sections[0], "decision");
  assert.equal(flow.sections[1], "findings");
  assert.equal(flow.sections.includes("must-change"), false);
});

test("production snapshot PR 80 maps reconciled findings including a non-kept row", async () => {
  const listed = await createSnapshotReviewPort().list();
  const record = listed.find((row) => row.number === 80);
  assert.ok(record);
  const flow = reviewMainFlow(record);
  assert.equal(flow.sections.includes("findings"), true);
  assert.ok(flow.findings.some((finding) => finding.disposition !== "kept"));
  assert.equal(flow.sections.indexOf("findings"), flow.sections.indexOf("must-change") + 1);
  assert.equal(flow.sections.includes("first-pass"), false);
});

test("decision summary is trimmed and empty whitespace becomes an empty string", () => {
  assert.equal(
    reviewMainFlow(sample({ summary: "  Ready to merge.  " })).decision.summary,
    "Ready to merge.",
  );
  assert.equal(reviewMainFlow(sample({ summary: "\n\t  \n" })).decision.summary, "");
  assert.equal(
    reviewMainFlow(sample({ summary: "The public review section is ready to merge." })).decision.summary,
    "The public review section is ready to merge.",
  );
});

test("confidence is clamped to 0-100 at the main-flow boundary", () => {
  assert.equal(reviewMainFlow(sample({ confidence: -4 })).decision.confidence, 0);
  assert.equal(reviewMainFlow(sample({ confidence: 140 })).decision.confidence, 100);
  assert.equal(reviewMainFlow(sample({ confidence: 86 })).decision.confidence, 86);
  assert.equal(reviewMainFlow(sample({ confidence: Number.NaN })).decision.confidence, 0);
  assert.equal(reviewMainFlow(sample({ confidence: Number.POSITIVE_INFINITY })).decision.confidence, 0);
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

test("main flow UI leads with the decision, then blockers, then appearance", () => {
  const source = readFileSync(join(reviewsRoot, "ui/review-main-flow.tsx"), "utf8");
  const decisionAt = source.indexOf("<DecisionBand");
  const sectionsAt = source.indexOf("<FlowSections");
  const panelAt = source.indexOf("{panel}");
  assert.ok(decisionAt >= 0);
  assert.ok(sectionsAt > decisionAt);
  assert.ok(panelAt > sectionsAt);
  assert.match(source, /copy\.pr\.decision/);
  assert.match(source, /copy\.pr\.confidenceUnit/);
  assert.match(source, /min-h-target/);
  assert.match(source, /focus-ring-control/);
  assert.doesNotMatch(source, /key=\{blocker\.title\}/);
  assert.doesNotMatch(source, /key=\{finding\.title\}/);
  assert.match(source, /<details>/);
  assert.doesNotMatch(source, /<details\s+open/);
  assert.doesNotMatch(source, /\bopen:\s*false/);
});

test("verdict and status tones live in one shared module", () => {
  const badges = readFileSync(join(reviewsRoot, "ui/review-badges.ts"), "utf8");
  assert.match(badges, /export const VERDICT_BADGE/);
  assert.match(badges, /export const STATUS_TONE/);
  for (const file of [
    "review-list-view.tsx",
    "review-pr-view.tsx",
    "review-run-view.tsx",
    "review-main-flow.tsx",
    "review-agent-list.tsx",
    "review-console.tsx",
  ]) {
    const source = readFileSync(join(reviewsRoot, "ui", file), "utf8");
    assert.match(source, /from "\.\/review-badges"/);
    assert.doesNotMatch(source, /const VERDICT_BADGE/);
    assert.doesNotMatch(source, /const STATUS_TONE/);
  }
});

test("invalid PR metadata falls back to missing copy instead of the raw param", () => {
  const prPage = readFileSync(join(reviewsAppRoot, "pr/[n]/page.tsx"), "utf8");
  const runPage = readFileSync(join(reviewsAppRoot, "pr/[n]/runs/[id]/page.tsx"), "utf8");
  for (const source of [prPage, runPage]) {
    assert.match(source, /parsePrNumber/);
    assert.match(source, /reviewsCopy\.metadata\.missing/);
    assert.doesNotMatch(source, /`\/reviews\/pr\/\$\{n\}`/);
  }
});

test("reviews not-found uses missing copy and links back to the list", () => {
  const source = readFileSync(join(reviewsAppRoot, "not-found.tsx"), "utf8");
  assert.match(source, /reviewsCopy\.metadata\.missing\.title/);
  assert.match(source, /href="\/reviews"/);
  assert.match(source, /reviewsCopy\.pr\.back/);
});

const CONSOLE_ITEMS = [
  { id: "flow", kind: "flow", title: "Main flow", status: "done" },
  { id: "agent-review", kind: "agent", title: "Review agent", status: "done" },
  { id: "workflow-check", kind: "workflow", title: "Contrast check", status: "error" },
];

test("empty or omitted selection hash selects the main flow", () => {
  assert.equal(parseReviewSelection("", CONSOLE_ITEMS), "flow");
  assert.equal(parseReviewSelection("#", CONSOLE_ITEMS), "flow");
});

test("an item hash selects that agent or workflow", () => {
  assert.equal(parseReviewSelection("#item-agent-review", CONSOLE_ITEMS), "agent-review");
  assert.equal(parseReviewSelection("#item-workflow-check", CONSOLE_ITEMS), "workflow-check");
});

test("unknown, hostile, and skip-link hashes fall back to the main flow", () => {
  assert.equal(parseReviewSelection("#item-missing", CONSOLE_ITEMS), "flow");
  assert.equal(parseReviewSelection("#item-<script>", CONSOLE_ITEMS), "flow");
  assert.equal(parseReviewSelection("#javascript:alert(1)", CONSOLE_ITEMS), "flow");
  assert.equal(parseReviewSelection("#main-content", CONSOLE_ITEMS), "flow");
  assert.equal(parseReviewSelection("#item-", CONSOLE_ITEMS), "flow");
  assert.equal(parseReviewSelection(`#item-${"x".repeat(4000)}`, CONSOLE_ITEMS), "flow");
});

test("duplicate item ids resolve to the first match", () => {
  const duplicated = [
    { id: "agent-review", kind: "agent", title: "First", status: "done" },
    { id: "flow", kind: "flow", title: "Main flow", status: "done" },
    { id: "agent-review", kind: "agent", title: "Second", status: "error" },
  ];
  assert.equal(parseReviewSelection("#item-agent-review", duplicated), "agent-review");
});

test("empty items still default to the synthesised flow id", () => {
  assert.equal(parseReviewSelection("", []), "flow");
  assert.equal(parseReviewSelection("#item-agent-review", []), "flow");
});

test("canonical default selection omits the hash", () => {
  assert.equal(selectionHash("flow", "flow"), "");
  assert.equal(selectionHash("agent-review", "flow"), "#item-agent-review");
});

test("share URL merge keeps appearance query and selection hash together", () => {
  assert.equal(
    mergeReviewShareUrl({
      pathname: "/reviews/pr/71",
      search: "identity=volt&preview=dark",
      hash: "#item-agent-review",
    }),
    "/reviews/pr/71?identity=volt&preview=dark#item-agent-review",
  );
  assert.equal(
    mergeReviewShareUrl({
      pathname: "/reviews/pr/71",
      search: "?density=compact",
      hash: "item-agent-review",
    }),
    "/reviews/pr/71?density=compact#item-agent-review",
  );
  assert.equal(
    mergeReviewShareUrl({ pathname: "/reviews/pr/71", search: "", hash: "" }),
    "/reviews/pr/71",
  );
  assert.equal(
    mergeReviewShareUrl({ pathname: "/reviews/pr/71", search: "?", hash: "#" }),
    "/reviews/pr/71",
  );
  assert.equal(
    mergeReviewShareUrl({
      pathname: "/reviews/pr/71",
      search: "preview=dark",
      hash: "",
    }),
    "/reviews/pr/71?preview=dark",
  );
  assert.equal(
    mergeReviewShareUrl({
      pathname: "/reviews/pr/71",
      search: "",
      hash: "#item-agent-review",
    }),
    "/reviews/pr/71#item-agent-review",
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

test("a run with no items synthesises one flow row from its status", () => {
  assert.deepEqual(
    reviewConsoleItems({ id: "run-71", status: "error", startedAt: "2026-11-09T14:50:00.000Z" }, "Main flow"),
    [{ id: "flow", kind: "flow", title: "Main flow", status: "error" }],
  );
});

test("items without a flow row get a synthesised flow prepended", () => {
  assert.deepEqual(
    reviewConsoleItems(
      {
        id: "run-71",
        status: "done",
        startedAt: "2026-11-09T14:50:00.000Z",
        items: [{ id: "agent-review", kind: "agent", title: "Review agent", status: "done" }],
      },
      "Main flow",
    ),
    [
      { id: "flow", kind: "flow", title: "Main flow", status: "done" },
      { id: "agent-review", kind: "agent", title: "Review agent", status: "done" },
    ],
  );
});

test("the latest run is the newest startedAt, and a tie keeps the first", () => {
  const older = { id: "run-a", status: "done", startedAt: "2026-11-09T13:00:00.000Z" };
  const newer = { id: "run-b", status: "done", startedAt: "2026-11-09T15:00:00.000Z" };
  assert.equal(latestReviewRun([older, newer])?.id, "run-b");
  assert.equal(latestReviewRun([newer, older])?.id, "run-b");
  assert.equal(latestReviewRun([older, { ...newer, id: "run-c", startedAt: older.startedAt }])?.id, "run-a");
  assert.equal(latestReviewRun([]), undefined);
});

test("public fixtures expose a main flow plus an agent, and a workflow somewhere", async () => {
  const listed = await createFixtureReviewPort().list();
  const kinds = new Set();
  let flowWithAgent = false;
  for (const record of listed) {
    for (const run of record.runs) {
      const kindsHere = new Set((run.items ?? []).map((item) => item.kind));
      for (const kind of kindsHere) kinds.add(kind);
      if (kindsHere.has("flow") && kindsHere.has("agent")) flowWithAgent = true;
    }
  }
  assert.equal(flowWithAgent, true);
  assert.ok(kinds.has("workflow"));
});

test("a private record with agent titles never appears", async () => {
  const port = createFixtureReviewPort([
    sample({
      number: 99,
      visibility: "private",
      title: "hidden",
      runs: [
        {
          id: "run-99",
          status: "done",
          startedAt: "2026-11-01T00:00:00.000Z",
          items: [{ id: "agent-x", kind: "agent", title: "secret agent", status: "done" }],
        },
      ],
    }),
  ]);
  assert.deepEqual(await port.list(), []);
});

test("item titles go through the public scrubber", () => {
  const [clean] = toPublicReviews([
    sample({
      runs: [
        {
          id: "run-71",
          status: "done",
          startedAt: "2026-11-09T14:50:00.000Z",
          items: [
            {
              id: "agent-x",
              kind: "agent",
              title: "Call with Bearer abcDEF123._~+/=-",
              status: "done",
            },
          ],
        },
      ],
    }),
  ]);
  assert.match(clean.runs[0].items[0].title, /Bearer \[redacted\]/);
  assert.doesNotMatch(clean.runs[0].items[0].title, /abcDEF123/);
});

test("the review console uses a kit drawer below md and hides the desktop column", () => {
  const src = readFileSync(join(FEATURE, "ui", "review-console.tsx"), "utf8");
  assert.match(src, /DrawerTrigger/);
  assert.match(src, /DrawerTitle/);
  assert.match(src, /min-h-target/);
  assert.match(src, /md:hidden/);
  assert.match(src, /max-md:hidden/);
  assert.match(src, /direction="left"/);
  assert.match(src, /mobile="sheet"/);
  assert.match(src, /copy\.console\.openList/);
  assert.doesNotMatch(src, /<main[\s>]/);
  assert.doesNotMatch(src, /AppShell/);
  assert.doesNotMatch(src, /SidebarNavItem/);
  assert.doesNotMatch(src, /id=["']item-/);
});

test("PR and run views render the same console and drop the agent-detail stub", () => {
  const pr = readFileSync(join(FEATURE, "ui", "review-pr-view.tsx"), "utf8");
  const run = readFileSync(join(FEATURE, "ui", "review-run-view.tsx"), "utf8");
  assert.match(pr, /ReviewConsole/);
  assert.match(run, /ReviewConsole/);
  assert.doesNotMatch(pr, /agentDetail/);
  assert.doesNotMatch(pr, /<details/);
  assert.doesNotMatch(run, /<details/);
});

test("findings and agent lists use copy keys and keep the empty-state pattern", () => {
  const main = readFileSync(join(reviewsRoot, "ui/review-main-flow.tsx"), "utf8");
  const agents = readFileSync(join(reviewsRoot, "ui/review-agent-list.tsx"), "utf8");
  const flowUi = `${main}\n${agents}`;
  const run = readFileSync(join(reviewsRoot, "ui/review-run-view.tsx"), "utf8");
  const pr = readFileSync(join(reviewsRoot, "ui/review-pr-view.tsx"), "utf8");
  const consoleSrc = readFileSync(join(reviewsRoot, "ui/review-console.tsx"), "utf8");
  assert.match(main, /copy\.pr\.findings\}/);
  assert.match(main, /copy\.pr\.findingsEmpty/);
  assert.match(main, /copy\.disposition/);
  assert.match(main, /finding\.id/);
  assert.match(main, /run\.agents/);
  assert.match(agents, /copy\.agent\.id/);
  assert.match(agents, /copy\.agent\.name/);
  assert.match(agents, /copy\.agent\.kind/);
  assert.match(agents, /copy\.agent\.model/);
  assert.match(agents, /copy\.run\.agents/);
  assert.match(agents, /copy\.pr\.agentDetailEmpty/);
  assert.match(agents, /EmptyState/);
  assert.match(agents, /<details>/);
  assert.doesNotMatch(agents, /<details\s+open/);
  assert.match(main, /<details>/);
  assert.doesNotMatch(main, /<details\s+open/);
  assert.match(consoleSrc, /agentsReveal/);
  assert.match(run, /agentsReveal=/);
  assert.doesNotMatch(run, /agentsReveal=["']disclosure["']/);
  assert.doesNotMatch(pr, /agentsReveal/);
  for (const source of [flowUi, run, pr, consoleSrc]) {
    assert.doesNotMatch(source, /"(Kept|Downgraded|Dismissed|Id|Name|Kind|Model)"/);
  }
});

test("appearance share write keeps the selection hash", () => {
  const src = readFileSync(join(FEATURE, "ui", "appearance-panel.tsx"), "utf8");
  assert.match(src, /mergeReviewShareUrl/);
  assert.match(src, /window\.location\.hash/);
});
