import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

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
import { filterReviewList } from "../features/reviews/model/list-filter.ts";
import { parsePublicReviewSnapshot } from "../features/reviews/model/parse-snapshot.ts";
import { toPublicReviews } from "../features/reviews/model/public-review.ts";
import {
  listReviewPrParamsFrom,
  listReviewRunParamsFrom,
  listReviewSitemapPathsFrom,
} from "../features/reviews/model/review-routes.ts";

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
    token: "super-secret",
    actions: [
      {
        title: "Drop the key",
        detail: "Authorization: Basic dXNlcjpwYXNz lives in /Users/alice/.config",
      },
    ],
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
