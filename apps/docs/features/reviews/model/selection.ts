export function mergeReviewShareUrl(parts: {
  pathname: string;
  search: string;
  hash: string;
}): string {
  const search = normalizeSearch(parts.search);
  const hash = normalizeHash(parts.hash);
  return `${parts.pathname}${search}${hash}`;
}

function normalizeSearch(search: string): string {
  if (search === "" || search === "?") return "";
  return search.startsWith("?") ? search : `?${search}`;
}

function normalizeHash(hash: string): string {
  if (hash === "" || hash === "#") return "";
  return hash.startsWith("#") ? hash : `#${hash}`;
}
