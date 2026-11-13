const ISSUE_OR_PR_HASH = /^(issue|pr)-\d+$/;

/** `?open=first` / `#first` select the first row; `#issue-n` / `#pr-n` win when present. */
export function issueOpenTarget(search: string, hash: string): "first" | string | null {
  const query = search.startsWith("?") ? search.slice(1) : search;
  const id = hash.startsWith("#") ? hash.slice(1) : hash;
  if (ISSUE_OR_PR_HASH.test(id)) return id;
  const params = new URLSearchParams(query);
  if (params.get("open") === "first" || id === "first") return "first";
  return null;
}

/** First id when the URL has no target or an unknown hash. */
export function resolveIssueOpenId(
  ids: readonly string[],
  search: string,
  hash: string,
): string | null {
  const first = ids[0];
  if (first === undefined) return null;
  const target = issueOpenTarget(search, hash);
  if (target === null || target === "first") return first;
  return ids.includes(target) ? target : first;
}
