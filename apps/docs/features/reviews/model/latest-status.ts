import type { LatestStatus, TimelineEntry } from "../ports/review-port";

/** Last entry by startedAt; a review with a verdict shows that verdict. */
export function latestStatus(entries: readonly TimelineEntry[]): LatestStatus | null {
  const first = entries[0];
  if (first === undefined) return null;
  let last = first;
  for (const entry of entries) {
    if (entry.startedAt > last.startedAt) last = entry;
  }
  if (last.type === "review" && last.verdict !== null) return last.verdict;
  return last.status;
}
