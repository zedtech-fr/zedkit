import { tryCatch } from "@zedtech/zedkit-core";

import type { PublicIssueIndex, TimelineEntry } from "../ports/review-port";

const SECRET_KEY_PATTERN =
  /(api[_-]?key|secret|token|password|passwd|signature|authorization|cookie|set-cookie|private[_-]?key|credentials|prompt)/i;
const AUTH_TOKEN_PATTERN = /\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi;
const HOME_PATH_PATTERN = /(?:\/(?:home|Users)\/\S+|(?:[A-Za-z]:)?\\Users\\\S+)/g;
const LIVE_URL_SECRET_QUERY = /(token|password|passwd|secret|signature|authorization)=/i;

export type VisibilityField = string | null | undefined;

/** Public-repo rule: only the string "private" is dropped; missing, null, and "public" stay. */
export function isExportableVisibility(visibility: VisibilityField): boolean {
  return visibility !== "private";
}

function scrubString(value: string): string {
  return value
    .replace(AUTH_TOKEN_PATTERN, (match) => `${match.split(/\s/, 1)[0]} [redacted]`)
    .replace(HOME_PATH_PATTERN, "[path]");
}

function scrub(value: unknown, key?: string): unknown {
  if (key !== undefined && SECRET_KEY_PATTERN.test(key)) return "[redacted]";
  if (typeof value === "string") return scrubString(value);
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => scrub(item));
  const out: Record<string, unknown> = {};
  for (const [entryKey, entryValue] of Object.entries(value)) {
    out[entryKey] = scrub(entryValue, entryKey);
  }
  return out;
}

/** Keep https URLs; drop secrets in query/hash/userinfo and anything that is not https. */
export function sanitizeLiveUrl(value: string | null): string | null {
  if (value === null || value.trim() === "") return null;
  const parsed = tryCatch(() => new URL(value));
  if (!parsed.ok) return null;
  const url = parsed.value;
  if (url.protocol !== "https:") return null;
  if (url.username !== "" || url.password !== "") return null;
  const haystack = `${url.search} ${url.hash}`;
  if (LIVE_URL_SECRET_QUERY.test(haystack) || AUTH_TOKEN_PATTERN.test(haystack)) return null;
  if (HOME_PATH_PATTERN.test(url.pathname)) return null;
  return url.toString();
}

function sanitizeEntry(entry: TimelineEntry): TimelineEntry {
  return { ...entry, liveUrl: sanitizeLiveUrl(entry.liveUrl) };
}

export type GatedIssue = PublicIssueIndex["issues"][number] & {
  readonly visibility?: VisibilityField;
};
export type GatedPullRequest = PublicIssueIndex["pullRequests"][number] & {
  readonly visibility?: VisibilityField;
};
export type GatedIndex = {
  readonly version: 1;
  readonly kind: string;
  readonly issues: readonly GatedIssue[];
  readonly pullRequests: readonly GatedPullRequest[];
};

function omitVisibility<T extends { readonly visibility?: VisibilityField }>(
  row: T,
): Omit<T, "visibility"> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (key === "visibility") continue;
    out[key] = value;
  }
  return out as Omit<T, "visibility">;
}

function stripIssue(issue: GatedIssue) {
  const rest = omitVisibility(issue);
  return {
    ...rest,
    entries: rest.entries.map(sanitizeEntry),
  };
}

function stripPullRequest(entry: GatedPullRequest) {
  const rest = omitVisibility(entry);
  return {
    ...rest,
    entries: rest.entries.map(sanitizeEntry),
  };
}

/** Drop private rows, scrub secrets and paths, then sanitize live URLs. */
export function toPublicIndex(index: GatedIndex): PublicIssueIndex {
  const scrubbed = scrub(structuredClone(index)) as GatedIndex;
  const issues = scrubbed.issues
    .filter((issue) => isExportableVisibility(issue.visibility) && issue.entries.length > 0)
    .map(stripIssue);
  const keptIssueNumbers = new Set(issues.map((issue) => issue.number));
  const pullRequests = scrubbed.pullRequests
    .filter((entry) => {
      if (!isExportableVisibility(entry.visibility)) return false;
      if (entry.issueNumber === null) return entry.entries.length > 0;
      return keptIssueNumbers.has(entry.issueNumber);
    })
    .map(stripPullRequest);
  return {
    version: 1,
    kind: scrubbed.kind,
    issues,
    pullRequests,
  };
}
