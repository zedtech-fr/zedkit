import type {
  IssueRecord,
  IssueState,
  PublicIssueIndex,
  PullRequestIndexEntry,
  ReviewVerdict,
  TimelineEntry,
  TimelineEntryStatus,
  TimelineEntryType,
} from "../ports/review-port";
import { sanitizeLiveUrl } from "./public-review.ts";

export const PUBLIC_INDEX_KIND = "public-github-runs";

export type GithubIssue = {
  readonly number: number;
  readonly title: string;
  readonly state: IssueState;
};

export type GithubPullRequest = {
  readonly number: number;
  readonly closingIssueNumbers: readonly number[];
};

export type GithubCatalog = {
  readonly issues: readonly GithubIssue[];
  readonly pullRequests: readonly GithubPullRequest[];
};

export type GithubReviewFallback = {
  readonly prNumber: number;
  readonly verdict: ReviewVerdict | null;
  readonly score: number | null;
};

export type RunsApiRun = {
  readonly runId: string;
  readonly issue: number | null;
  readonly pr: number | null;
  readonly kind: TimelineEntryType;
  readonly phase: string | null;
  readonly status: TimelineEntryStatus;
  readonly startedAt: string;
  readonly durationMs: number | null;
  readonly models: readonly string[];
  readonly verdict: ReviewVerdict | null;
  readonly score: number | null;
  readonly superseded: boolean;
  readonly liveUrl: string | null;
};

const ENTRY_TYPES = new Set<TimelineEntryType>([
  "plan",
  "implement",
  "review",
  "improve",
  "dry-run",
]);

function fallbackTitle(number: number): string {
  return `Issue #${number}`;
}

function laterIso(left: string, right: string): string {
  return left < right ? right : left;
}

function lastStartedAt(entries: readonly TimelineEntry[]): string {
  let latest = entries[0]?.startedAt ?? new Date(0).toISOString();
  for (const entry of entries) latest = laterIso(latest, entry.startedAt);
  return latest;
}

function entryType(run: RunsApiRun): TimelineEntryType {
  if (run.phase !== null && ENTRY_TYPES.has(run.phase as TimelineEntryType)) {
    return run.phase as TimelineEntryType;
  }
  return run.kind;
}

function runCounts(runs: readonly RunsApiRun[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const run of runs) {
    counts.set(run.runId, (counts.get(run.runId) ?? 0) + 1);
  }
  return counts;
}

function toEntry(run: RunsApiRun, split: boolean): TimelineEntry {
  const type = entryType(run);
  return {
    id: split && run.phase !== null && run.phase !== "" ? `${run.runId}:${run.phase}` : run.runId,
    runId: run.runId,
    type,
    status: run.status,
    startedAt: run.startedAt,
    durationMs: run.durationMs,
    models: [...run.models],
    verdict: run.verdict,
    liveUrl: sanitizeLiveUrl(run.liveUrl),
    score: run.score,
    superseded: run.superseded,
  };
}

function applyFallback(
  entry: TimelineEntry,
  fallback: GithubReviewFallback | undefined,
): TimelineEntry {
  if (fallback === undefined) return entry;
  return {
    ...entry,
    verdict: entry.verdict ?? fallback.verdict,
    score: entry.score ?? fallback.score,
  };
}

function uniquePush(list: number[], n: number): void {
  if (!list.includes(n)) list.push(n);
}

export function mergePublicIndex(input: {
  readonly github: GithubCatalog;
  readonly runs: readonly RunsApiRun[];
  readonly fallbacks?: readonly GithubReviewFallback[];
}): PublicIssueIndex {
  const counts = runCounts(input.runs);
  const fallbackByPr = new Map(
    (input.fallbacks ?? []).map((row) => [row.prNumber, row] as const),
  );
  const githubIssues = new Map(input.github.issues.map((row) => [row.number, row] as const));
  const issueEntries = new Map<number, TimelineEntry[]>();
  const issuePrs = new Map<number, number[]>();
  const prEntries = new Map<number, { issueNumber: number | null; runIds: string[]; entries: TimelineEntry[] }>();

  for (const pull of input.github.pullRequests) {
    for (const issueNumber of pull.closingIssueNumbers) {
      const list = issuePrs.get(issueNumber) ?? [];
      uniquePush(list, pull.number);
      issuePrs.set(issueNumber, list);
      const existing = prEntries.get(pull.number);
      if (existing === undefined) {
        prEntries.set(pull.number, { issueNumber, runIds: [], entries: [] });
      } else if (existing.issueNumber === null) {
        existing.issueNumber = issueNumber;
      }
    }
  }

  for (const run of input.runs) {
    const split = (counts.get(run.runId) ?? 0) > 1;
    const entry = applyFallback(toEntry(run, split), run.pr === null ? undefined : fallbackByPr.get(run.pr));
    if (run.pr !== null) {
      const existing = prEntries.get(run.pr) ?? { issueNumber: run.issue, runIds: [], entries: [] };
      if (existing.issueNumber === null && run.issue !== null) existing.issueNumber = run.issue;
      if (!existing.runIds.includes(run.runId)) existing.runIds.push(run.runId);
      existing.entries.push(entry);
      prEntries.set(run.pr, existing);
      if (existing.issueNumber !== null) {
        const list = issuePrs.get(existing.issueNumber) ?? [];
        uniquePush(list, run.pr);
        issuePrs.set(existing.issueNumber, list);
      }
    }
    const issueNumber = run.issue ?? (run.pr === null ? null : (prEntries.get(run.pr)?.issueNumber ?? null));
    if (issueNumber !== null) {
      const list = issueEntries.get(issueNumber) ?? [];
      list.push(entry);
      issueEntries.set(issueNumber, list);
    }
  }

  const issues: IssueRecord[] = [...issueEntries.entries()].map(([number, entries]) => {
    const github = githubIssues.get(number);
    return {
      number,
      title: github?.title ?? fallbackTitle(number),
      state: github?.state ?? "open",
      pullRequests: issuePrs.get(number) ?? [],
      lastRunAt: lastStartedAt(entries),
      entries,
    };
  });

  const pullRequests: PullRequestIndexEntry[] = [...prEntries.entries()].map(([number, row]) => ({
    number,
    issueNumber: row.issueNumber,
    runIds: row.runIds,
    entries: row.entries,
  }));

  return { version: 1, kind: PUBLIC_INDEX_KIND, issues, pullRequests };
}
