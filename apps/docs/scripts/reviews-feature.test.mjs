import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_REVIEW_APPEARANCE,
  parseReviewAppearance,
  serializeReviewAppearance,
} from "../lib/review-appearance.ts";
import { createFixtureReviewPort } from "../features/reviews/adapters/fixture.ts";
import { reviewsCopy } from "../features/reviews/i18n/reviews-copy.ts";
import { filterReviewList } from "../features/reviews/model/list-filter.ts";
import { reviewMainFlow } from "../features/reviews/model/main-flow.ts";
import { parsePrNumber } from "../features/reviews/model/pr-number.ts";
import { toPublicReviews } from "../features/reviews/model/public-review.ts";

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
    runs: [{ id: "run-71", status: "done", startedAt: "2026-11-09T14:50:00.000Z" }],
    ...overrides,
  };
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

test("default production fixtures cover open, merged, and more than one run status", async () => {
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
  assert.ok(flow.firstPass);
  assert.deepEqual(
    flow.firstPass?.findings.map((finding) => finding.disposition),
    ["kept", "downgraded", "dismissed"],
  );
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
  for (const file of ["review-list-view.tsx", "review-pr-view.tsx", "review-run-view.tsx", "review-main-flow.tsx"]) {
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
