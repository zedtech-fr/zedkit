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
import { assertPubliclySafe, toPublicReviews } from "../features/reviews/model/public-review.ts";
import {
  listReviewPrParamsFrom,
  listReviewRunParamsFrom,
  listReviewSitemapPathsFrom,
} from "../features/reviews/model/review-routes.ts";
import { toReviewRecord } from "../features/reviews/model/to-review-record.ts";
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

function viewSample(overrides = {}) {
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

function wrapper(reviews, extra = {}) {
  return { version: 1, kind: "public-live-runs", reviews, ...extra };
}

const sample = viewSample;

test("private and unknown visibility never survive the public gate", () => {
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

test("secret-like keys, bearer tokens, and home paths do not survive the public gate", () => {
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

test("a public review is kept with its list fields", () => {
  const [kept] = toPublicReviews([liveSample()]);
  assert.equal(kept.visibility, "public");
  assert.equal(kept.run.verdict, "APPROVE");
  assert.equal(kept.run.confidence_score, 8.6);
  assert.equal(kept.run.status, "done");
  assert.equal(kept.run.sha, "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  assert.deepEqual(kept.related, []);
  assert.equal(kept.items[0].kind, "main");
});

test("a version-1 snapshot parses its reviews", () => {
  const parsed = parsePublicReviewSnapshot(wrapper([liveSample()]));
  assert.equal(parsed.ok, true);
  assert.deepEqual(
    parsed.value.map((record) => record.run.pr),
    [71],
  );
  assert.equal(parsed.value[0].decision.verdict, "APPROVE");
});

test("an empty snapshot is valid", () => {
  const parsed = parsePublicReviewSnapshot(wrapper([]));
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.value, []);
});

test("an unknown snapshot kind is accepted when version is 1", () => {
  const parsed = parsePublicReviewSnapshot(wrapper([liveSample()], { kind: "redacted-export" }));
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value.length, 1);
});

test("version 2 snapshots are rejected", () => {
  const parsed = parsePublicReviewSnapshot(wrapper([liveSample()], { version: 2 }));
  assert.equal(parsed.ok, false);
});

test("unknown keys on a snapshot record are rejected", () => {
  const parsed = parsePublicReviewSnapshot(wrapper([{ ...liveSample(), apiKey: "x" }]));
  assert.equal(parsed.ok, false);
});

test("unknown keys on nested snapshot objects are rejected", () => {
  const parsed = parsePublicReviewSnapshot(
    wrapper([liveSample({ run: { ...liveSample().run, token: "x" } })]),
  );
  assert.equal(parsed.ok, false);
  assert.equal(
    parsePublicReviewSnapshot(
      wrapper([
        liveSample({
          items: [liveItem({ entries: [{ type: "message", text: "x", token: "x" }] })],
        }),
      ]),
    ).ok,
    false,
  );
});

test("unknown keys on the snapshot wrapper are rejected", () => {
  const parsed = parsePublicReviewSnapshot(wrapper([liveSample()], { token: "x" }));
  assert.equal(parsed.ok, false);
});

test("a snapshot with a missing required field is rejected", () => {
  const rest = liveSample();
  delete rest.run;
  const parsed = parsePublicReviewSnapshot(wrapper([rest]));
  assert.equal(parsed.ok, false);
});

test("wrong types in a snapshot are rejected", () => {
  assert.equal(
    parsePublicReviewSnapshot(wrapper([liveSample({ run: { ...liveSample().run, created_at: "71" } })])).ok,
    false,
  );
  assert.equal(parsePublicReviewSnapshot(null).ok, false);
  assert.equal(parsePublicReviewSnapshot([]).ok, false);
});

test("unknown visibility in a snapshot is rejected", () => {
  assert.equal(parsePublicReviewSnapshot(wrapper([liveSample({ visibility: "team" })])).ok, false);
});

test("omitted visibility is rejected at parse and dropped at the public gate", () => {
  const omitted = liveSample();
  delete omitted.visibility;
  assert.equal(parsePublicReviewSnapshot(wrapper([omitted])).ok, false);
  assert.deepEqual(toPublicReviews([omitted]).map((row) => row.run.pr), []);
});

test("private visibility is kept by parse so the public gate can drop it", () => {
  const parsed = parsePublicReviewSnapshot(wrapper([liveSample({ visibility: "private" })]));
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value[0].visibility, "private");
});

test("an item without entries still parses", () => {
  const item = liveItem();
  delete item.entries;
  const parsed = parsePublicReviewSnapshot(wrapper([liveSample({ items: [item] })]));
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.value[0].items[0].entries, []);
});

test("verdict_json extra keys are accepted", () => {
  const parsed = parsePublicReviewSnapshot(
    wrapper([liveSample({ verdict_json: { verdict: "APPROVE", extra_flag: true, blocking: [] } })]),
  );
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value[0].verdict_json.extra_flag, true);
});

test("the fixture port lists only public copies", async () => {
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

test("the fixture test double covers more than one verdict and run status", async () => {
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
    viewSample(),
    viewSample({
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
  const wrongVersion = writeSnapshot([liveSample()], { version: 2 });
  assert.throws(() => createSnapshotReviewPort(wrongVersion));
});

test("static params and sitemap come from public snapshot records only", async () => {
  const path = writeSnapshot([
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

test("the checked-in public snapshot is a live-shaped recorded run", async () => {
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
  assert.ok(String(row.run.review_size ?? "").length > 0);
  const kinds = new Set(row.items.map((item) => item.kind));
  assert.ok(kinds.has("main"));
  assert.ok(kinds.has("lens") || kinds.has("gate"));
  assert.ok(kinds.has("second_pass"));
  for (const kind of ["main", "lens", "second_pass"]) {
    const item = row.items.find((entry) => (kind === "lens" ? entry.kind === "lens" || entry.kind === "gate" : entry.kind === kind));
    if (kind === "lens" && item === undefined) continue;
    assert.ok(item, `missing ${kind}`);
    assert.ok(item.model.length > 0);
    assert.equal(typeof item.duration_s, "number");
    assert.equal(typeof item.tool_count, "number");
    assert.ok(String(item.status).length > 0);
  }
  assert.ok(row.decision);
  assert.ok(row.decision.first_pass);
  assert.ok(row.decision.second_pass);
  assert.equal(typeof row.decision.posted, "boolean");
  assert.ok(Array.isArray(row.decision.must));
  assert.ok(Array.isArray(row.decision.notes));
  assert.ok(Array.isArray(row.decision.dismissed));
  const dispositions = [];
  for (const item of [...(row.verdict_json?.blocking ?? []), ...(row.verdict_json?.notes ?? [])]) {
    if (item && typeof item === "object" && typeof item._disposition === "string") {
      dispositions.push(item._disposition);
    }
  }
  for (const note of row.decision.notes) {
    if (note.tag) dispositions.push(note.tag);
  }
  assert.ok(dispositions.includes("kept"));
  const transcript = row.items.find((item) => {
    const types = new Set((item.entries ?? []).map((entry) => entry.type));
    return types.has("tool") && types.has("message");
  });
  assert.ok(transcript);
  assert.ok(
    transcript.started_ms != null || transcript.duration_s != null,
  );
  assert.equal(typeof transcript.tool_count, "number");
  assert.ok(transcript.tokens_in != null || transcript.tokens_out != null);
  assert.ok(transcript.last_activity_ms != null);
  const snapshotText = readFileSync(join(FEATURE, "adapters", "public-reviews.json"), "utf8");
  assert.doesNotMatch(snapshotText, /\/home\//);
  assert.doesNotMatch(snapshotText, /\/Users\//);
  assert.doesNotMatch(snapshotText, /Bearer (?!\[redacted\])/);
  assert.doesNotMatch(snapshotText, /Basic (?!\[redacted\])/);
  const featureIndex = readFileSync(join(FEATURE, "index.tsx"), "utf8");
  assert.match(featureIndex, /createSnapshotReviewPort\(\)/);
  assert.doesNotMatch(featureIndex, /createFixtureReviewPort/);
  const params = await listReviewPrParamsFrom(createSnapshotReviewPort());
  assert.ok(params.some((row) => row.n === String(listed[0].run.pr)));
  const sitemap = await listReviewSitemapPaths();
  assert.equal(sitemap[0], "/reviews");
  for (const record of listed) {
    assert.ok(sitemap.includes(`/reviews/pr/${record.run.pr}`));
    assert.ok(sitemap.includes(`/reviews/pr/${record.run.pr}/runs/${record.run.run_id}`));
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
  const lives = await createFixtureReviewPort().list();
  const comment = toReviewRecord(lives.find((record) => record.run.pr === 18));
  assert.equal(comment?.verdict, "comment");
  assert.equal(comment?.status, "running");
  assert.deepEqual(comment?.actions, []);
  assert.equal(reviewMainFlow(comment).sections.includes("must-change"), false);
});

test("production APPROVE fixture has no Must change section", async () => {
  const lives = await createFixtureReviewPort().list();
  const approve = toReviewRecord(lives.find((record) => record.run.pr === 71));
  assert.equal(approve?.verdict, "approve");
  assert.deepEqual(approve?.actions, []);
  const flow = reviewMainFlow(approve);
  assert.equal(flow.sections.includes("must-change"), false);
  assert.equal(flow.firstPass, null);
});

test("production REQUEST_CHANGES fixture lists blockers after the decision", async () => {
  const lives = await createFixtureReviewPort().list();
  const request = toReviewRecord(lives.find((record) => record.run.pr === 42));
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
  const lives = await createFixtureReviewPort().list();
  const superseded = toReviewRecord(lives.find((record) => record.run.pr === 83));
  assert.ok(superseded);
  const flow = reviewMainFlow(superseded);
  assert.equal(flow.sections[0], "decision");
  assert.equal(flow.sections[1], "must-change");
  assert.equal(flow.sections[2], "findings");
  assert.equal(flow.sections[3], "first-pass");
  assert.deepEqual(
    flow.findings.map((finding) => finding.disposition),
    ["kept", "downgraded", "dismissed"],
  );
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

test("the recorded snapshot maps must-change and kept first-pass findings", async () => {
  const lives = await createSnapshotReviewPort().list();
  const live = lives[0];
  assert.ok(live);
  const record = toReviewRecord(live, lives);
  const flow = reviewMainFlow(record);
  assert.equal(flow.sections[0], "decision");
  assert.equal(flow.sections.includes("must-change"), true);
  assert.ok(flow.findings.some((finding) => finding.disposition === "kept"));
  assert.equal(flow.sections.includes("first-pass"), true);
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
  const lives = await createFixtureReviewPort().list();
  const listed = lives.map((row) => toReviewRecord(row, lives));
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
    liveSample({
      visibility: "private",
      run: { ...liveSample().run, pr: 99, issue_title: "hidden" },
      items: [liveItem({ id: "agent-x", name: "secret agent", kind: "lens" })],
    }),
  ]);
  assert.deepEqual(await port.list(), []);
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
