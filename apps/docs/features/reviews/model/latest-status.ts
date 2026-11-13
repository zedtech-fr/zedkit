import type { LatestStatus, TimelineEntry } from "../ports/review-port";

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

/** Copy sorted newest-first for the `/issues` accordion; does not mutate input. */
export function entriesNewestFirst(entries: readonly TimelineEntry[]): TimelineEntry[] {
  return [...entries].sort((a, b) => {
    if (a.startedAt !== b.startedAt) return a.startedAt > b.startedAt ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
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
