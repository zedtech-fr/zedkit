import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_REVIEW_APPEARANCE,
  parseReviewAppearance,
  serializeReviewAppearance,
} from "../lib/review-appearance.ts";
import { createFixtureReviewPort } from "../features/reviews/adapters/fixture.ts";
import { filterReviewList } from "../features/reviews/model/list-filter.ts";
import { toPublicReviews } from "../features/reviews/model/public-review.ts";

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
