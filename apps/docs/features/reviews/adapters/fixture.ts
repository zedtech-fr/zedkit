import { toPublicReviews } from "../model/public-review.ts";
import type {
  LiveDecision,
  LiveItemDetail,
  LiveRunInfo,
  LiveVerdict,
  PublicLiveRun,
  ReviewPort,
} from "../ports/review-port";

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
          text: "The section root is the list, never a blank landing. Verdict, confidence, and the short summary stay readable in a dense page of notes, links, and run history. Share the preview look from the Appearance panel; token drafts stay on the advanced editor.",
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

function copyRecord(record: PublicLiveRun): PublicLiveRun {
  return structuredClone(record);
}

function latestForPr(records: readonly PublicLiveRun[], n: number): PublicLiveRun | undefined {
  let latest: PublicLiveRun | undefined;
  for (const record of records) {
    if (record.run.pr !== n) continue;
    if (latest === undefined || record.run.created_at > latest.run.created_at) latest = record;
  }
  return latest;
}

export function createFixtureReviewPort(seed: readonly PublicLiveRun[] = FIXTURES): ReviewPort {
  const records = toPublicReviews(seed);
  return {
    list() {
      return Promise.resolve(records.map(copyRecord));
    },
    getByPr(n: number) {
      const record = Number.isInteger(n) ? latestForPr(records, n) : undefined;
      return Promise.resolve(record === undefined ? null : copyRecord(record));
    },
    getRun(n: number, id: string) {
      const record = Number.isInteger(n)
        ? records.find((item) => item.run.pr === n && item.run.run_id === id)
        : undefined;
      return Promise.resolve(record === undefined ? null : copyRecord(record));
    },
  };
}
