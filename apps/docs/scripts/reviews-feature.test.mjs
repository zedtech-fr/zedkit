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
import { filterReviewList } from "../features/reviews/model/list-filter.ts";
import { toPublicReviews } from "../features/reviews/model/public-review.ts";
import {
  latestReviewRun,
  mergeReviewShareUrl,
  parseReviewSelection,
  reviewConsoleItems,
  selectionHash,
} from "../features/reviews/model/selection.ts";

const FEATURE = join(dirname(fileURLToPath(import.meta.url)), "..", "features", "reviews");

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

test("appearance share write keeps the selection hash", () => {
  const src = readFileSync(join(FEATURE, "ui", "appearance-panel.tsx"), "utf8");
  assert.match(src, /mergeReviewShareUrl/);
  assert.match(src, /window\.location\.hash/);
});
