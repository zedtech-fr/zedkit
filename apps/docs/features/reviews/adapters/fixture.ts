import { toPublicReviews } from "../model/public-review.ts";
import type { ReviewPort, ReviewRecord, ReviewRun } from "../ports/review-port";

const FIXTURES: readonly ReviewRecord[] = [
  {
    number: 71,
    title: "Add a public review section",
    verdict: "approve",
    confidence: 86,
    status: "done",
    headSha: "c0ffeeabc123def4567890aaabbbcccdddeeefff",
    lastRunAt: "2026-11-09T15:00:00.000Z",
    prState: "open",
    visibility: "public",
    notes:
      "The section root is the list, never a blank landing. Verdict, confidence, and the short summary stay readable in a dense page of notes and run history. Share the preview look from the Appearance panel; token drafts stay on the advanced editor.",
    summary: "The public review section is ready to merge.",
    evidence: "",
    actions: [],
    runs: [
      {
        id: "run-71",
        status: "done",
        startedAt: "2026-11-09T14:50:00.000Z",
        items: [
          { id: "flow", kind: "flow", title: "Main flow", status: "done" },
          { id: "agent-review", kind: "agent", title: "Review agent", status: "done" },
        ],
      },
      {
        id: "run-71-earlier",
        status: "done",
        startedAt: "2026-11-09T13:00:00.000Z",
        items: [
          { id: "flow", kind: "flow", title: "Main flow", status: "done" },
          { id: "agent-review", kind: "agent", title: "Review agent", status: "done" },
        ],
      },
    ],
  },
  {
    number: 42,
    title: "Tighten contrast on Press",
    verdict: "request-changes",
    confidence: 64,
    status: "error",
    headSha: "bada55abc123def4567890aaabbbcccdddeeefff",
    lastRunAt: "2026-11-08T09:12:00.000Z",
    prState: "merged",
    visibility: "public",
    notes:
      "Dark Press must keep caption contrast on the list and the PR page. The run failed while checking the compact preview; open the run for the log excerpt.",
    summary: "Dark Press caption contrast still fails on the list and the PR page.",
    evidence: "",
    actions: [
      {
        title: "Raise muted text on dark Press",
        detail: "List metadata (SHA, last run) must stay at the 13px floor and 4.5:1 against the page.",
      },
    ],
    runs: [
      {
        id: "run-42",
        status: "error",
        startedAt: "2026-11-08T09:10:00.000Z",
        items: [
          { id: "flow", kind: "flow", title: "Main flow", status: "error" },
          { id: "workflow-contrast", kind: "workflow", title: "Contrast check", status: "error" },
        ],
      },
    ],
  },
  {
    number: 18,
    title: "Document ThemeScope on a dense page",
    verdict: "comment",
    confidence: 51,
    status: "running",
    headSha: "defaceabc123def4567890aaabbbcccdddeeefff",
    lastRunAt: "2026-11-10T08:00:00.000Z",
    prState: "open",
    visibility: "public",
    notes:
      "A running review still belongs on the list. Status is a named wait, not a spinner. This fixture does not update after deploy.",
    summary: "A running review still belongs on the list; this fixture does not update after deploy.",
    evidence: "",
    actions: [],
    runs: [
      {
        id: "run-18",
        status: "running",
        startedAt: "2026-11-10T08:00:00.000Z",
        items: [
          { id: "flow", kind: "flow", title: "Main flow", status: "running" },
          { id: "agent-docs", kind: "agent", title: "Docs agent", status: "running" },
        ],
      },
    ],
  },
  {
    number: 83,
    title: "Supersede a first-pass review",
    verdict: "request-changes",
    confidence: 72,
    status: "done",
    headSha: "cafe00abc123def4567890aaabbbcccdddeeefff",
    lastRunAt: "2026-11-10T11:00:00.000Z",
    prState: "open",
    visibility: "public",
    notes:
      "The first pass over-called. One finding stayed a merge blocker; one became a note; one was out of scope.",
    summary: "The first pass is outdated. One merge blocker remains.",
    evidence: "",
    actions: [
      {
        title: "Keep the list empty state useful",
        detail: "When there are no reviews yet, say what will appear and that the page is still the list.",
      },
    ],
    firstPass: {
      findings: [
        {
          title: "Keep the list empty state useful",
          detail: "The empty list still needs a next click. This stays a merge blocker.",
          disposition: "kept",
        },
        {
          title: "Rename the section root",
          detail: "The list-as-root rule is now a note, not a blocker.",
          disposition: "downgraded",
        },
        {
          title: "Add a sidebar for lenses",
          detail: "On-demand disclosure already covers lenses. Out of scope for this review.",
          disposition: "dismissed",
        },
      ],
    },
    runs: [
      {
        id: "run-83",
        status: "done",
        startedAt: "2026-11-10T10:50:00.000Z",
        items: [
          { id: "flow", kind: "flow", title: "Main flow", status: "done" },
          { id: "agent-review", kind: "agent", title: "Review agent", status: "done" },
        ],
      },
    ],
  },
  {
    number: 99,
    title: "Private fixture that must never appear",
    verdict: "comment",
    confidence: 10,
    status: "done",
    headSha: "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    lastRunAt: "2026-11-01T00:00:00.000Z",
    prState: "open",
    visibility: "private",
    notes: "Gated. Not for the public site.",
    summary: "Gated.",
    evidence: "",
    actions: [],
    runs: [
      {
        id: "run-99",
        status: "done",
        startedAt: "2026-11-01T00:00:00.000Z",
        items: [{ id: "agent-private", kind: "agent", title: "secret agent", status: "done" }],
      },
    ],
  },
];

function copyRecord(record: ReviewRecord): ReviewRecord {
  return structuredClone(record);
}

export function createFixtureReviewPort(seed: readonly ReviewRecord[] = FIXTURES): ReviewPort {
  const records = toPublicReviews(seed);
  return {
    list() {
      return Promise.resolve(records.map(copyRecord));
    },
    getByPr(n: number) {
      const record = Number.isInteger(n) ? records.find((item) => item.number === n) : undefined;
      return Promise.resolve(record === undefined ? null : copyRecord(record));
    },
    getRun(n: number, id: string) {
      const record = Number.isInteger(n) ? records.find((item) => item.number === n) : undefined;
      const run = record?.runs.find((item) => item.id === id);
      return Promise.resolve(run === undefined ? null : structuredClone(run) as ReviewRun);
    },
  };
}

export async function listReviewSitemapPaths(): Promise<string[]> {
  const records = await createFixtureReviewPort().list();
  const paths = ["/reviews"];
  for (const record of records) {
    paths.push(`/reviews/pr/${record.number}`);
    for (const run of record.runs) {
      paths.push(`/reviews/pr/${record.number}/runs/${run.id}`);
    }
  }
  return paths;
}
