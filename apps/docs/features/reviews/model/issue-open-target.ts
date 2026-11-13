const ISSUE_OR_PR_HASH = /^(issue|pr)-\d+$/;

/** `?open=first` / `#first` open the first accordion; `#issue-n` / `#pr-n` win when present. */
export function issueOpenTarget(search: string, hash: string): "first" | string | null {
  const query = search.startsWith("?") ? search.slice(1) : search;
  const id = hash.startsWith("#") ? hash.slice(1) : hash;
  if (ISSUE_OR_PR_HASH.test(id)) return id;
  const params = new URLSearchParams(query);
  if (params.get("open") === "first" || id === "first") return "first";
  return null;
}
