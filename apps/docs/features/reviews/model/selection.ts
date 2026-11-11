import type { ReviewConsoleItem, ReviewRun } from "../ports/review-port";

export const REVIEW_FLOW_ID = "flow";

export function reviewConsoleItems(
  run: ReviewRun,
  flowTitle: string,
): readonly [ReviewConsoleItem, ...ReviewConsoleItem[]] {
  const listed = run.items ?? [];
  const first = listed[0];
  const synthesised: ReviewConsoleItem = {
    id: REVIEW_FLOW_ID,
    kind: "flow",
    title: flowTitle,
    status: run.status,
  };
  if (first === undefined) return [synthesised];
  if (listed.some((item) => item.kind === "flow")) return [first, ...listed.slice(1)];
  return [synthesised, ...listed];
}

export function defaultReviewSelection(items: readonly ReviewConsoleItem[]): string {
  return items.find((item) => item.kind === "flow")?.id ?? items[0]?.id ?? REVIEW_FLOW_ID;
}

export function parseReviewSelection(hash: string, items: readonly ReviewConsoleItem[]): string {
  const fallback = defaultReviewSelection(items);
  if (!hash.startsWith("#item-")) return fallback;
  const id = hash.slice("#item-".length);
  if (id.length === 0) return fallback;
  return items.find((item) => item.id === id)?.id ?? fallback;
}

export function selectionHash(id: string, defaultId: string): string {
  return id === defaultId ? "" : `#item-${id}`;
}

export function mergeReviewShareUrl(parts: {
  pathname: string;
  search: string;
  hash: string;
}): string {
  const search = normalizeSearch(parts.search);
  const hash = normalizeHash(parts.hash);
  return `${parts.pathname}${search}${hash}`;
}

export function latestReviewRun(runs: readonly ReviewRun[]): ReviewRun | undefined {
  let latest: ReviewRun | undefined;
  for (const run of runs) {
    if (latest === undefined || run.startedAt > latest.startedAt) latest = run;
  }
  return latest;
}

function normalizeSearch(search: string): string {
  if (search === "" || search === "?") return "";
  return search.startsWith("?") ? search : `?${search}`;
}

function normalizeHash(hash: string): string {
  if (hash === "" || hash === "#") return "";
  return hash.startsWith("#") ? hash : `#${hash}`;
}
