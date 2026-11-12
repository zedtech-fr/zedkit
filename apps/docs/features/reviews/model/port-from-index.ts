import type {
  IssueRecord,
  PublicIssueIndex,
  PublicLiveRun,
  ReviewPort,
  RunRecord,
  TimelineEntry,
  UnlinkedPullRequest,
} from "../ports/review-port";

function copyIssue(issue: IssueRecord): IssueRecord {
  return structuredClone(issue);
}

function sortEntries(entries: readonly TimelineEntry[]): TimelineEntry[] {
  return [...entries].sort((a, b) => {
    if (a.startedAt !== b.startedAt) return a.startedAt < b.startedAt ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

function uniqueModels(entries: readonly TimelineEntry[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of entries) {
    for (const model of entry.models) {
      if (seen.has(model)) continue;
      seen.add(model);
      out.push(model);
    }
  }
  return out;
}

function summedDuration(entries: readonly TimelineEntry[]): number | null {
  let total = 0;
  let any = false;
  for (const entry of entries) {
    if (entry.durationMs === null) continue;
    total += entry.durationMs;
    any = true;
  }
  return any ? total : null;
}

function firstLiveUrl(entries: readonly TimelineEntry[]): string | null {
  for (const entry of entries) {
    if (entry.liveUrl !== null) return entry.liveUrl;
  }
  return null;
}

export function runRecordFromEntries(runId: string, entries: readonly TimelineEntry[]): RunRecord | null {
  const matched = sortEntries(entries.filter((entry) => entry.runId === runId));
  const first = matched[0];
  const last = matched[matched.length - 1];
  if (first === undefined || last === undefined) return null;
  return {
    runId,
    entries: matched,
    status: last.status,
    verdict: last.verdict,
    models: uniqueModels(matched),
    durationMs: summedDuration(matched),
    liveUrl: firstLiveUrl(matched),
    startedAt: first.startedAt,
  };
}

function toUnlinked(entry: PublicIssueIndex["pullRequests"][number]): UnlinkedPullRequest | null {
  if (entry.issueNumber !== null || entry.entries.length === 0) return null;
  const sorted = sortEntries(entry.entries);
  const last = sorted[sorted.length - 1];
  if (last === undefined) return null;
  return {
    number: entry.number,
    lastRunAt: last.startedAt,
    entries: sorted,
  };
}

function copyLive(record: PublicLiveRun): PublicLiveRun {
  return structuredClone(record);
}

function liveBelongsToIssue(
  live: PublicLiveRun,
  issueNumber: number,
  issue: IssueRecord | undefined,
  runId: string,
): boolean {
  if (live.run.run_id !== runId) return false;
  if (live.run.issue === issueNumber) return true;
  if (issue !== undefined && issue.entries.some((entry) => entry.runId === runId)) return true;
  return live.run.issue == null && live.run.pr === issueNumber;
}

function latestForPr(records: readonly PublicLiveRun[], n: number): PublicLiveRun | undefined {
  let latest: PublicLiveRun | undefined;
  for (const record of records) {
    if (record.run.pr !== n) continue;
    if (latest === undefined || record.run.created_at > latest.run.created_at) latest = record;
  }
  return latest;
}

export function createComposedReviewPort(
  index: PublicIssueIndex,
  lives: readonly PublicLiveRun[] = [],
): ReviewPort {
  const issues = [...index.issues]
    .filter((issue) => issue.entries.length > 0)
    .map((issue) => ({ ...issue, entries: sortEntries(issue.entries) }))
    .sort((a, b) => {
      if (a.lastRunAt !== b.lastRunAt) return a.lastRunAt < b.lastRunAt ? 1 : -1;
      return b.number - a.number;
    });
  const pullRequests = index.pullRequests.map((entry) => ({
    ...entry,
    entries: sortEntries(entry.entries),
  }));

  return {
    listIssues() {
      return Promise.resolve(issues.map(copyIssue));
    },
    listUnlinkedPullRequests() {
      return Promise.resolve(
        pullRequests.flatMap((entry) => {
          const unlinked = toUnlinked(entry);
          return unlinked === null ? [] : [structuredClone(unlinked)];
        }),
      );
    },
    listPullRequests() {
      return Promise.resolve(structuredClone(pullRequests));
    },
    getIssue(n: number) {
      if (!Number.isInteger(n)) return Promise.resolve(null);
      const issue = issues.find((item) => item.number === n);
      return Promise.resolve(issue === undefined ? null : copyIssue(issue));
    },
    getUnlinkedPullRequest(n: number) {
      if (!Number.isInteger(n)) return Promise.resolve(null);
      const entry = pullRequests.find((item) => item.number === n);
      const unlinked = entry === undefined ? null : toUnlinked(entry);
      return Promise.resolve(unlinked === null ? null : structuredClone(unlinked));
    },
    getRun(issueNumber: number, runId: string) {
      if (!Number.isInteger(issueNumber)) return Promise.resolve(null);
      const issue = issues.find((item) => item.number === issueNumber);
      const live = lives.find((item) => liveBelongsToIssue(item, issueNumber, issue, runId));
      if (live !== undefined) return Promise.resolve(copyLive(live));
      if (issue === undefined) return Promise.resolve(null);
      const run = runRecordFromEntries(runId, issue.entries);
      return Promise.resolve(run === null ? null : structuredClone(run));
    },
    getUnlinkedRun(prNumber: number, runId: string) {
      if (!Number.isInteger(prNumber)) return Promise.resolve(null);
      const entry = pullRequests.find((item) => item.number === prNumber && item.issueNumber === null);
      if (entry === undefined) return Promise.resolve(null);
      const run = runRecordFromEntries(runId, entry.entries);
      return Promise.resolve(run === null ? null : structuredClone(run));
    },
    resolvePr(n: number) {
      if (!Number.isInteger(n)) return Promise.resolve(null);
      const entry = pullRequests.find((item) => item.number === n);
      if (entry === undefined) return Promise.resolve(null);
      return Promise.resolve({
        issueNumber: entry.issueNumber,
        runIds: [...entry.runIds],
      });
    },
    list() {
      return Promise.resolve(lives.map(copyLive));
    },
    getByPr(n: number) {
      const record = Number.isInteger(n) ? latestForPr(lives, n) : undefined;
      return Promise.resolve(record === undefined ? null : copyLive(record));
    },
    isPublicStandIn() {
      return Promise.resolve(index.kind === "public-stand-in");
    },
  };
}
