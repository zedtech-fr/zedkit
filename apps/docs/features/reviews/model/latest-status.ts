import type { LatestStatus, ReviewVerdict, TimelineEntry, TimelineEntryStatus } from "../ports/review-port";

function compareIsoDesc(a: string, b: string): number {
  if (a === b) return 0;
  return a > b ? -1 : 1;
}

function pickNewer(a: TimelineEntry, b: TimelineEntry): TimelineEntry {
  const byTime = compareIsoDesc(entryUpdatedAt(a), entryUpdatedAt(b));
  if (byTime !== 0) return byTime < 0 ? a : b;
  return a.id > b.id ? a : b;
}

/** Last timeline row by startedAt. */
export function latestEntry(entries: readonly TimelineEntry[]): TimelineEntry | null {
  const first = entries[0];
  if (first === undefined) return null;
  let last = first;
  for (const entry of entries) {
    if (entry.startedAt > last.startedAt) last = entry;
  }
  return last;
}

/** Last entry by startedAt; a review with a verdict shows that verdict. */
export function latestStatus(entries: readonly TimelineEntry[]): LatestStatus | null {
  const last = latestEntry(entries);
  if (last === null) return null;
  if (last.type === "review" && last.verdict !== null) return last.verdict;
  return last.status;
}

/** Sum of known step durations; `null` when every step is still running. */
export function summedDurationMs(entries: readonly TimelineEntry[]): number | null {
  let total = 0;
  let any = false;
  for (const entry of entries) {
    if (entry.durationMs === null) continue;
    total += entry.durationMs;
    any = true;
  }
  return any ? total : null;
}

/** Completed and failed steps prefer `endedAt`; running steps stay on `startedAt`. */
export function entryUpdatedAt(entry: TimelineEntry): string {
  if (entry.status === "running") return entry.startedAt;
  return entry.endedAt ?? entry.startedAt;
}

/**
 * Copy sorted for the `/issues` accordion: running first, then newest
 * `endedAt ?? startedAt`, then `id` descending. Does not mutate input.
 * Port `sortEntries` stays oldest-first.
 */
export function entriesNewestFirst(entries: readonly TimelineEntry[]): TimelineEntry[] {
  return [...entries].sort((a, b) => {
    const aRunning = a.status === "running";
    const bRunning = b.status === "running";
    if (aRunning !== bRunning) return aRunning ? -1 : 1;
    const byTime = compareIsoDesc(entryUpdatedAt(a), entryUpdatedAt(b));
    if (byTime !== 0) return byTime;
    return a.id > b.id ? -1 : a.id < b.id ? 1 : 0;
  });
}

/** Latest finished step by `entryUpdatedAt`, then `id` descending. */
export function latestFinishedEntry(entries: readonly TimelineEntry[]): TimelineEntry | null {
  let last: TimelineEntry | null = null;
  for (const entry of entries) {
    if (entry.status === "running") continue;
    last = last === null ? entry : pickNewer(entry, last);
  }
  return last;
}

export type HeadlineOutcome = {
  kind: "verdict" | "status";
  verdict?: ReviewVerdict;
  status?: TimelineEntryStatus;
  score: number | null;
};

/**
 * Scan headline: running wins, else the newest review verdict, else the
 * newest finished failed step (`latestFinishedEntry`). Completed-only
 * work returns null (no badge).
 */
export function headlineOutcome(entries: readonly TimelineEntry[]): HeadlineOutcome | null {
  if (entries.some((entry) => entry.status === "running")) {
    return { kind: "status", status: "running", score: null };
  }
  let review: TimelineEntry | null = null;
  for (const entry of entries) {
    if (entry.type !== "review" || entry.verdict === null) continue;
    review = review === null ? entry : pickNewer(entry, review);
  }
  if (review !== null && review.verdict !== null) {
    return { kind: "verdict", verdict: review.verdict, score: review.score ?? null };
  }
  const last = latestFinishedEntry(entries);
  if (last?.status === "failed") {
    return { kind: "status", status: "failed", score: null };
  }
  return null;
}
