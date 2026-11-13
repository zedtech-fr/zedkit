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

/**
 * First id when the URL has no target or asks for first.
 * A well-formed `#issue-n` / `#pr-n` that is not on the list returns
 * `null` so the page can show `copy.issue.missing` instead of silently
 * opening another row while the stale hash stays in the URL.
 */
export function resolveIssueOpenId(
  ids: readonly string[],
  search: string,
  hash: string,
): string | null {
  const first = ids[0];
  const target = issueOpenTarget(search, hash);
  if (target === null || target === "first") return first ?? null;
  return ids.includes(target) ? target : null;
}
