import { parsePublicReviewSnapshot } from "../model/parse-snapshot.ts";
import { createComposedReviewPort } from "../model/port-from-index.ts";
import { HOSTED_LIVE_HREF_PREFIX, liveRunsToIndex, toPublicIndex, toPublicReviews } from "../model/public-review.ts";
import type {
  LiveDecision,
  LiveItemDetail,
  LiveRunInfo,
  LiveVerdict,
  PublicLiveRun,
  ReviewPort,
} from "../ports/review-port";

const FIXTURE_INDEX = {
  version: 1 as const,
  kind: "fixture",
  issues: [
    {
      number: 108,
      title: "Add a public issues section",
      state: "closed" as const,
      pullRequests: [133],
      lastRunAt: "2026-11-10T18:40:00.000Z",
      entries: [
        {
          id: "108-plan",
          runId: "run-108-impl",
          type: "plan" as const,
          status: "completed" as const,
          startedAt: "2026-11-10T16:00:00.000Z",
          durationMs: 420000,
          models: ["cursor-grok-4.6-high"],
          verdict: null,
          liveUrl: `${HOSTED_LIVE_HREF_PREFIX}run-108-impl`,
        },
        {
          id: "108-implement",
          runId: "run-108-impl",
          type: "implement" as const,
          status: "completed" as const,
          startedAt: "2026-11-10T16:10:00.000Z",
          durationMs: 2400000,
          models: ["cursor-grok-4.6-high"],
          verdict: null,
          liveUrl: `${HOSTED_LIVE_HREF_PREFIX}run-108-impl`,
        },
        {
          id: "108-review",
          runId: "run-108-review",
          type: "review" as const,
          status: "completed" as const,
          startedAt: "2026-11-10T17:20:00.000Z",
          durationMs: 900000,
          models: ["cursor-grok-4.6-high"],
          verdict: "approve" as const,
          liveUrl: `${HOSTED_LIVE_HREF_PREFIX}run-108-review`,
        },
        {
          id: "108-improve",
          runId: "run-108-improve",
          type: "improve" as const,
          status: "completed" as const,
          startedAt: "2026-11-10T18:40:00.000Z",
          durationMs: 780000,
          models: ["cursor-grok-4.6-high"],
          verdict: null,
          liveUrl: `${HOSTED_LIVE_HREF_PREFIX}run-108-improve`,
        },
      ],
    },
    {
      number: 93,
      title: "Failed implement with no opened pull request",
      state: "open" as const,
      pullRequests: [],
      lastRunAt: "2026-11-08T09:15:00.000Z",
      entries: [
        {
          id: "93-implement",
          runId: "run-93-impl",
          type: "implement" as const,
          status: "failed" as const,
          startedAt: "2026-11-08T09:15:00.000Z",
          durationMs: 300000,
          models: ["cursor-grok-4.6-high"],
          verdict: null,
          liveUrl: null,
        },
      ],
    },
    {
      number: 110,
      title: "Running implement still in progress",
      state: "open" as const,
      pullRequests: [],
      lastRunAt: "2026-11-11T08:00:00.000Z",
      entries: [
        {
          id: "110-implement",
          runId: "run-110-impl",
          type: "implement" as const,
          status: "running" as const,
          startedAt: "2026-11-11T08:00:00.000Z",
          durationMs: null,
          models: ["cursor-grok-4.6-high"],
          verdict: null,
          liveUrl: `${HOSTED_LIVE_HREF_PREFIX}run-110-impl`,
        },
      ],
    },
    {
      number: 99,
      title: "Private fixture that must never appear",
      state: "open" as const,
      pullRequests: [],
      lastRunAt: "2026-11-01T00:00:00.000Z",
      visibility: "private",
      entries: [
        {
          id: "99-review",
          runId: "run-99",
          type: "review" as const,
          status: "completed" as const,
          startedAt: "2026-11-01T00:00:00.000Z",
          durationMs: 1000,
          models: ["secret-model"],
          verdict: "comment" as const,
          liveUrl: "https://example.test/live/run-99",
        },
      ],
    },
  ],
  pullRequests: [
    {
      number: 133,
      issueNumber: 108,
      runIds: ["run-108-impl", "run-108-review", "run-108-improve"],
    },
    {
      number: 54,
      issueNumber: null,
      runIds: ["run-54-review"],
      entries: [
        {
          id: "54-review",
          runId: "run-54-review",
          type: "review" as const,
          status: "completed" as const,
          startedAt: "2026-11-07T14:00:00.000Z",
          durationMs: 480000,
          models: ["cursor-grok-4.6-high"],
          verdict: "comment" as const,
          liveUrl: `${HOSTED_LIVE_HREF_PREFIX}run-54-review`,
        },
      ],
    },
    {
      number: 50,
      issueNumber: null,
      runIds: ["run-50"],
      visibility: "private",
      entries: [
        {
          id: "50-review",
          runId: "run-50",
          type: "review" as const,
          status: "completed" as const,
          startedAt: "2026-11-01T00:00:00.000Z",
          durationMs: 1000,
          models: [],
          verdict: "comment" as const,
          liveUrl: null,
        },
      ],
    },
  ],
};

function item(partial: Partial<LiveItemDetail> & Pick<LiveItemDetail, "id" | "name" | "kind" | "status">): LiveItemDetail {
  return {
    engine: "test",
    engine_label: "test",
    model: "test-model",
    tool_count: 1,
    message_count: 1,
    tokens_in: 10,
    tokens_out: 4,
    duration_s: 12,
    started_ms: 1_762_698_500_000,
    last_activity_ms: 1_762_698_600_000,
    entries: [
      { type: "message", text: "hello" },
      { type: "tool", tool: "read", label: "Read", status: "done", output_chars: 4 },
    ],
    prompt: "review this",
    final_text: "done",
    ...partial,
  };
}

function run(partial: Partial<LiveRunInfo> & Pick<LiveRunInfo, "run_id" | "pr" | "status" | "verdict">): LiveRunInfo {
  return {
    sha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    engine: "test",
    engine_label: "test",
    created_at: 1_762_698_600,
    server_now: 1_762_698_600,
    elapsed_s: 12,
    confidence_score: 8.6,
    review_size: "full",
    ...partial,
  };
}

function decision(partial: Partial<LiveDecision> = {}): LiveDecision {
  return {
    posted: true,
    must: [],
    notes: [],
    dismissed: [],
    degraded: false,
    enforcement_reasons: [],
    first_pass: { verdict: "APPROVE", confidence_score: 8 },
    second_pass: { kept: 0, dropped: 0, adjusted: 0, confirmed_blockers: 0 },
    verdict: "APPROVE",
    confidence_score: 8.6,
    summary: "",
    ...partial,
  };
}

function live(partial: Partial<PublicLiveRun> & { run: LiveRunInfo }): PublicLiveRun {
  return {
    visibility: "public",
    decision: decision(),
    items: [item({ id: "main", name: "Main flow", kind: "main", status: "done" })],
    verdict_json: { verdict: "APPROVE", blocking: [], notes: [] },
    related: [],
    ...partial,
  };
}

const FIXTURES: readonly PublicLiveRun[] = [
  live({
    run: run({
      run_id: "run-71",
      pr: 71,
      status: "done",
      verdict: "APPROVE",
      issue_title: "Add a public review section",
    }),
    decision: decision({
      summary: "The public review section is ready to merge.",
      notes: [
        {
          text: "The section root is the list, never a blank landing. Verdict, confidence, and the short summary stay readable in a dense page of notes, links, and run history.",
        },
      ],
    }),
    items: [
      item({ id: "main", name: "Main flow", kind: "main", status: "done" }),
      item({ id: "agent-review", name: "Review agent", kind: "lens", status: "done" }),
    ],
  }),
  live({
    run: run({
      run_id: "run-42",
      pr: 42,
      status: "error",
      verdict: "REQUEST_CHANGES",
      sha: "bada55abc123def4567890aaabbbcccdddeeefff",
      created_at: 1_762_585_920,
      server_now: 1_762_585_920,
      confidence_score: 6.4,
      issue_title: "Tighten contrast on Press",
    }),
    decision: decision({
      verdict: "REQUEST_CHANGES",
      confidence_score: 6.4,
      first_pass: { verdict: "REQUEST_CHANGES", confidence_score: 6.4 },
      summary: "Dark Press caption contrast still fails on the list and the PR page.",
      must: [
        {
          text: "Raise muted text on dark Press",
        },
      ],
      notes: [
        {
          text: "Dark Press must keep caption contrast on the list and the PR page. The run failed while checking the compact preview; open the run for the log excerpt.",
        },
      ],
    }),
    verdict_json: { verdict: "REQUEST_CHANGES", blocking: [], notes: [] },
    items: [
      item({ id: "main", name: "Main flow", kind: "main", status: "error" }),
      item({ id: "workflow-contrast", name: "Contrast check", kind: "workflow", status: "error" }),
    ],
  }),
  live({
    run: run({
      run_id: "run-18",
      pr: 18,
      status: "running",
      verdict: "COMMENT",
      sha: "defaceabc123def4567890aaabbbcccdddeeefff",
      created_at: 1_762_761_600,
      server_now: 1_762_761_600,
      confidence_score: 5.1,
      issue_title: "Document ThemeScope on a dense page",
    }),
    decision: decision({
      posted: false,
      verdict: "COMMENT",
      confidence_score: 5.1,
      first_pass: { verdict: "COMMENT", confidence_score: 5.1 },
      summary: "A running review still belongs on the list; this fixture does not update after deploy.",
      notes: [
        {
          text: "A running review still belongs on the list. Status is a named wait, not a spinner. This fixture does not update after deploy.",
        },
      ],
    }),
    verdict_json: { verdict: "COMMENT", blocking: [], notes: [] },
    items: [
      item({ id: "main", name: "Main flow", kind: "main", status: "running" }),
      item({ id: "agent-docs", name: "Docs agent", kind: "lens", status: "running" }),
    ],
  }),
  live({
    run: run({
      run_id: "run-83",
      pr: 83,
      status: "done",
      verdict: "REQUEST_CHANGES",
      sha: "cafe00abc123def4567890aaabbbcccdddeeefff",
      created_at: 1_762_772_400,
      server_now: 1_762_772_400,
      confidence_score: 7.2,
      issue_title: "Supersede a first-pass review",
    }),
    decision: decision({
      verdict: "REQUEST_CHANGES",
      confidence_score: 7.2,
      first_pass: { verdict: "REQUEST_CHANGES", confidence_score: 7.2 },
      summary: "The first pass is outdated. One merge blocker remains.",
      must: [{ text: "Keep the list empty state useful" }],
      notes: [
        {
          tag: "downgraded",
          text: "The first pass over-called. One finding stayed a merge blocker; one became a note; one was out of scope.",
        },
      ],
      dismissed: ["Add a sidebar for lenses"],
    }),
    verdict_json: {
      verdict: "REQUEST_CHANGES",
      blocking: [
        {
          _disposition: "kept",
          text: "Keep the list empty state useful",
        },
      ],
      notes: [
        {
          _disposition: "downgraded",
          text: "Rename the section root",
        },
        {
          _disposition: "dismissed",
          text: "Add a sidebar for lenses",
        },
      ],
    } satisfies LiveVerdict,
    items: [
      item({ id: "main", name: "Main flow", kind: "main", status: "done" }),
      item({ id: "agent-review", name: "Review agent", kind: "lens", status: "done" }),
    ],
  }),
  live({
    visibility: "private",
    run: run({
      run_id: "run-99",
      pr: 99,
      status: "done",
      verdict: "COMMENT",
      sha: "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
      created_at: 1_761_955_200,
      server_now: 1_761_955_200,
      confidence_score: 1,
      issue_title: "Private fixture that must never appear",
    }),
    decision: decision({
      verdict: "COMMENT",
      confidence_score: 1,
      summary: "Gated.",
      notes: [{ text: "Gated. Not for the public site." }],
    }),
    items: [item({ id: "agent-private", name: "secret agent", kind: "lens", status: "done" })],
  }),
];

export function createFixtureReviewPort(seed?: unknown): ReviewPort {
  if (Array.isArray(seed)) {
    const lives = toPublicReviews(seed as PublicLiveRun[]);
    return createComposedReviewPort(liveRunsToIndex(lives), lives);
  }
  const indexSeed = seed === undefined ? FIXTURE_INDEX : seed;
  const parsed = parsePublicReviewSnapshot(indexSeed);
  if (!parsed.ok) {
    throw new Error(`fixture issue index: ${parsed.error.message}`, { cause: parsed.error });
  }
  if (Array.isArray(parsed.value)) {
    throw new Error("fixture issue index: unexpected live snapshot");
  }
  const index = toPublicIndex(parsed.value);
  const lives = seed === undefined ? toPublicReviews(FIXTURES) : [];
  return createComposedReviewPort(index, lives);
}
