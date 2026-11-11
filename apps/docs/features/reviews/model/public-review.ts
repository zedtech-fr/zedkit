import { tryCatch } from "@zedtech/zedkit-core";

import type {
  IssueRecord,
  LiveRelatedRun,
  PublicIssueIndex,
  PublicLiveRun,
  ReviewVerdict,
  TimelineEntry,
  TimelineEntryStatus,
  TimelineEntryType,
} from "../ports/review-port";

const SECRET_KEY_PATTERN =
  /(api[_-]?key|secret|token|password|passwd|signature|authorization|cookie|set-cookie|private[_-]?key|credentials)/i;
const INDEX_SECRET_KEY_PATTERN =
  /(api[_-]?key|secret|token|password|passwd|signature|authorization|cookie|set-cookie|private[_-]?key|credentials|prompt)/i;
const AUTH_TOKEN_PATTERN = /\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi;
const HOME_PATH_PATTERN = /(?:\/(?:home|Users)\/\S+|(?:[A-Za-z]:)?\\Users\\\S+)/g;
const LIVE_URL_SECRET_QUERY = /(token|password|passwd|secret|signature|authorization)=/i;
const UNSAFE_PATH_PATTERN = /\/home\/|\/Users\/|\\Users\\/;
const UNSAFE_TOKEN_PATTERN = /\b(?:Bearer|Basic)\s+(?!\[redacted\])[A-Za-z0-9._~+/=-]+/i;

/** `/g` keeps lastIndex; a match must not let the next .test() skip. */
function testReset(pattern: RegExp, value: string): boolean {
  pattern.lastIndex = 0;
  return pattern.test(value);
}

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

function scrub(value: unknown, key?: string, secretKeys: RegExp = SECRET_KEY_PATTERN): unknown {
  if (key !== undefined && secretKeys.test(key)) return "[redacted]";
  if (typeof value === "string") return scrubString(value);
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => scrub(item, undefined, secretKeys));
  const out: Record<string, unknown> = {};
  for (const [entryKey, entryValue] of Object.entries(value)) {
    out[entryKey] = scrub(entryValue, entryKey, secretKeys);
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
  if (LIVE_URL_SECRET_QUERY.test(haystack) || testReset(AUTH_TOKEN_PATTERN, haystack)) return null;
  if (testReset(HOME_PATH_PATTERN, url.pathname)) return null;
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
  const scrubbed = scrub(structuredClone(index), undefined, INDEX_SECRET_KEY_PATTERN) as GatedIndex;
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
  const out: PublicIssueIndex = {
    version: 1,
    kind: scrubbed.kind,
    issues,
    pullRequests,
  };
  assertPubliclySafe(out);
  return out;
}

/** Fail closed if a public payload still contains a home path or auth token. */
export function assertPubliclySafe(value: unknown): void {
  const text = JSON.stringify(value);
  if (UNSAFE_PATH_PATTERN.test(text) || UNSAFE_TOKEN_PATTERN.test(text)) {
    throw new Error("public review snapshot: unredacted token or machine path");
  }
}

/** Public live runs only; secret-like keys, tokens, and home paths are scrubbed. */
export function toPublicReviews(records: readonly PublicLiveRun[]): PublicLiveRun[] {
  const publicRows = records.filter((record) => record.visibility === "public");
  const scrubbed = publicRows.map((record) => scrub(structuredClone(record)) as PublicLiveRun);
  assertPubliclySafe(scrubbed);
  return scrubbed;
}

function mapLiveType(mode: string | null | undefined): TimelineEntryType {
  const normalized = String(mode ?? "").trim().toLowerCase();
  if (
    normalized === "plan" ||
    normalized === "implement" ||
    normalized === "review" ||
    normalized === "improve" ||
    normalized === "dry-run"
  ) {
    return normalized;
  }
  return "review";
}

function mapLiveStatus(value: string | null | undefined): TimelineEntryStatus {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "running" || normalized === "starting") return "running";
  if (normalized === "error" || normalized === "failed") return "failed";
  return "completed";
}

function mapLiveVerdict(value: string | null | undefined): ReviewVerdict | null {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("_", "-");
  if (normalized === "approve" || normalized === "request-changes" || normalized === "comment") {
    return normalized;
  }
  return null;
}

function isoFromUnixSeconds(value: number): string {
  return new Date(value * 1000).toISOString();
}

function entryFromLive(live: PublicLiveRun): TimelineEntry {
  const models = [...new Set(live.items.map((item) => item.model).filter((model) => model !== ""))];
  const durationMs = live.run.elapsed_s == null ? null : live.run.elapsed_s * 1000;
  return {
    id: live.run.run_id,
    runId: live.run.run_id,
    type: mapLiveType(live.run.mode),
    status: mapLiveStatus(live.run.status),
    startedAt: isoFromUnixSeconds(live.run.created_at),
    durationMs,
    models,
    verdict: mapLiveVerdict(live.decision?.verdict ?? live.run.verdict),
    liveUrl: sanitizeLiveUrl(live.run.live_url ?? null),
  };
}

function entryFromRelated(related: LiveRelatedRun): TimelineEntry {
  const durationMs = related.duration_s == null ? null : related.duration_s * 1000;
  const startedAt =
    related.created_at === undefined ? new Date(0).toISOString() : isoFromUnixSeconds(related.created_at);
  const engine = related.engine_label?.trim() ?? "";
  return {
    id: related.run_id,
    runId: related.run_id,
    type: mapLiveType(related.mode),
    status: mapLiveStatus(related.status),
    startedAt,
    durationMs,
    models: engine === "" ? [] : [engine],
    verdict: mapLiveVerdict(related.verdict),
    liveUrl: null,
  };
}

function liveIssueNumber(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) return null;
  return value;
}

function livePrNumber(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  return value;
}

function fallbackIssueTitle(number: number): string {
  return `Issue #${number}`;
}

function laterIso(left: string, right: string): string {
  return left < right ? right : left;
}

function collectLiveEntries(runs: readonly PublicLiveRun[]): {
  entries: TimelineEntry[];
  runIds: string[];
  issueNumber: number | null;
  title: string | null;
} {
  const entries: TimelineEntry[] = [];
  const runIds: string[] = [];
  const seen = new Set<string>();
  const sorted = [...runs].sort((a, b) => a.run.created_at - b.run.created_at);
  let issueNumber: number | null = null;
  let title: string | null = null;
  for (const live of sorted) {
    if (issueNumber === null) issueNumber = liveIssueNumber(live.run.issue);
    if (title === null) {
      const trimmed = live.run.issue_title?.trim() ?? "";
      if (trimmed !== "") title = trimmed;
    }
    if (!seen.has(live.run.run_id)) {
      seen.add(live.run.run_id);
      runIds.push(live.run.run_id);
    }
    entries.push(entryFromLive(live));
    for (const related of live.related) {
      if (seen.has(related.run_id)) continue;
      seen.add(related.run_id);
      runIds.push(related.run_id);
      entries.push(entryFromRelated(related));
    }
  }
  return { entries, runIds, issueNumber, title };
}

function lastStartedAt(entries: readonly TimelineEntry[]): string {
  let latest = entries[0]?.startedAt ?? new Date(0).toISOString();
  for (const entry of entries) {
    latest = laterIso(latest, entry.startedAt);
  }
  return latest;
}

function addIssueEntries(
  issues: Map<number, IssueRecord>,
  number: number,
  title: string,
  entries: readonly TimelineEntry[],
  prNumber: number | null,
): void {
  const existing = issues.get(number);
  const lastRunAt = lastStartedAt(entries);
  if (existing === undefined) {
    issues.set(number, {
      number,
      title,
      state: "open",
      pullRequests: prNumber === null ? [] : [prNumber],
      lastRunAt,
      entries: [...entries],
    });
    return;
  }
  const fallback = fallbackIssueTitle(number);
  issues.set(number, {
    ...existing,
    title: existing.title === fallback && title !== fallback ? title : existing.title,
    pullRequests:
      prNumber === null || existing.pullRequests.includes(prNumber)
        ? existing.pullRequests
        : [...existing.pullRequests, prNumber],
    lastRunAt: laterIso(existing.lastRunAt, lastRunAt),
    entries: [...existing.entries, ...entries],
  });
}

/** Map public live rows onto the issue-centric index (PRs without an issue number stay unlinked). */
export function liveRunsToIndex(records: readonly PublicLiveRun[]): PublicIssueIndex {
  const byPr = new Map<number, PublicLiveRun[]>();
  const issueOnly: PublicLiveRun[] = [];
  for (const record of records) {
    const pr = livePrNumber(record.run.pr);
    if (pr !== null) {
      const existing = byPr.get(pr) ?? [];
      existing.push(record);
      byPr.set(pr, existing);
      continue;
    }
    if (liveIssueNumber(record.run.issue) !== null) issueOnly.push(record);
  }
  const issues = new Map<number, IssueRecord>();
  const pullRequests: PublicIssueIndex["pullRequests"][number][] = [];
  for (const [number, runs] of byPr) {
    const collected = collectLiveEntries(runs);
    pullRequests.push({
      number,
      issueNumber: collected.issueNumber,
      runIds: collected.runIds,
      entries: collected.entries,
    });
    if (collected.issueNumber !== null) {
      addIssueEntries(
        issues,
        collected.issueNumber,
        collected.title ?? fallbackIssueTitle(collected.issueNumber),
        collected.entries,
        number,
      );
    }
  }
  for (const live of issueOnly) {
    const collected = collectLiveEntries([live]);
    if (collected.issueNumber === null) continue;
    addIssueEntries(
      issues,
      collected.issueNumber,
      collected.title ?? fallbackIssueTitle(collected.issueNumber),
      collected.entries,
      null,
    );
  }
  return {
    version: 1,
    kind: "public-live-runs",
    issues: [...issues.values()],
    pullRequests,
  };
}
