import { err, ok, type Result } from "@zedtech/zedkit-core";

import type {
  IssueRecord,
  IssueState,
  PullRequestIndexEntry,
  ReviewVerdict,
  TimelineEntry,
  TimelineEntryStatus,
  TimelineEntryType,
} from "../ports/review-port";
import type { GatedIndex, GatedIssue, GatedPullRequest, VisibilityField } from "./public-review";

const WRAPPER_KEYS = ["version", "kind", "issues", "pullRequests"] as const;
const ISSUE_KEYS = ["number", "title", "state", "pullRequests", "lastRunAt", "entries"] as const;
const ENTRY_KEYS = [
  "id",
  "runId",
  "type",
  "status",
  "startedAt",
  "durationMs",
  "models",
  "verdict",
  "liveUrl",
] as const;
const PR_KEYS = ["number", "issueNumber", "runIds"] as const;
const ISSUE_STATES = ["open", "closed"] as const;
const ENTRY_TYPES = ["plan", "implement", "review", "improve", "dry-run"] as const;
const ENTRY_STATUSES = ["running", "completed", "failed"] as const;
const VERDICTS = ["approve", "request-changes", "comment"] as const;

function fail(message: string): Result<never, Error> {
  return err(new Error(message));
}

function requiredObject(
  value: unknown,
  keys: readonly string[],
  label: string,
): Result<Record<string, unknown>, Error> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return fail(`${label} must be an object`);
  }
  const record = value as Record<string, unknown>;
  const actual = Object.keys(record);
  const missing = keys.filter((key) => !actual.includes(key));
  if (missing.length > 0) return fail(`${label} is missing ${missing.join(", ")}`);
  return ok(record);
}

function asString(value: unknown, label: string): Result<string, Error> {
  if (typeof value !== "string") return fail(`${label} must be a string`);
  return ok(value);
}

function asOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string,
): Result<T, Error> {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    return fail(`${label} must be ${allowed.join("|")}`);
  }
  return ok(value as T);
}

function asArray(value: unknown, label: string): Result<unknown[], Error> {
  if (!Array.isArray(value)) return fail(`${label} must be an array`);
  return ok(value);
}

function asSafeInteger(value: unknown, label: string): Result<number, Error> {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    return fail(`${label} must be a safe integer`);
  }
  return ok(value);
}

function asNullOr<T>(
  value: unknown,
  parseValue: (value: unknown) => Result<T, Error>,
): Result<T | null, Error> {
  if (value === null) return ok(null);
  return parseValue(value);
}

function mapItems<T>(
  items: unknown[],
  parseItem: (item: unknown, index: number) => Result<T, Error>,
): Result<T[], Error> {
  const out: T[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const parsed = parseItem(items[index], index);
    if (!parsed.ok) return parsed;
    out.push(parsed.value);
  }
  return ok(out);
}

function parseVisibility(value: unknown, label: string): Result<VisibilityField, Error> {
  if (value === undefined || value === null) return ok(value);
  if (typeof value !== "string") return fail(`${label}.visibility must be a string or null`);
  return ok(value);
}

function parseDurationMs(value: unknown, label: string): Result<number | null, Error> {
  return asNullOr(value, (inner) => {
    if (typeof inner !== "number" || !Number.isFinite(inner) || inner < 0) {
      return fail(`${label}.durationMs must be a finite number >= 0 or null`);
    }
    return ok(inner);
  });
}

function parseLiveUrl(value: unknown, label: string): Result<string | null, Error> {
  return asNullOr(value, (inner) => {
    const text = asString(inner, `${label}.liveUrl`);
    if (!text.ok) return text;
    return ok(text.value);
  });
}

function parseModels(value: unknown, label: string): Result<string[], Error> {
  const raw = asArray(value, `${label}.models`);
  if (!raw.ok) return raw;
  const models: string[] = [];
  for (let index = 0; index < raw.value.length; index += 1) {
    const item = asString(raw.value[index], `${label}.models[${index}]`);
    if (!item.ok) return item;
    if (item.value !== "") models.push(item.value);
  }
  return ok(models);
}

function parseEntry(value: unknown, index: number, label: string): Result<TimelineEntry, Error> {
  const path = `${label}[${index}]`;
  const obj = requiredObject(value, ENTRY_KEYS, path);
  if (!obj.ok) return obj;
  const id = asString(obj.value.id, `${path}.id`);
  if (!id.ok) return id;
  const runId = asString(obj.value.runId, `${path}.runId`);
  if (!runId.ok) return runId;
  const type = asOneOf<TimelineEntryType>(obj.value.type, ENTRY_TYPES, `${path}.type`);
  if (!type.ok) return type;
  const status = asOneOf<TimelineEntryStatus>(obj.value.status, ENTRY_STATUSES, `${path}.status`);
  if (!status.ok) return status;
  const startedAt = asString(obj.value.startedAt, `${path}.startedAt`);
  if (!startedAt.ok) return startedAt;
  const durationMs = parseDurationMs(obj.value.durationMs, path);
  if (!durationMs.ok) return durationMs;
  const models = parseModels(obj.value.models, path);
  if (!models.ok) return models;
  const verdict = asNullOr(obj.value.verdict, (inner) =>
    asOneOf<ReviewVerdict>(inner, VERDICTS, `${path}.verdict`),
  );
  if (!verdict.ok) return verdict;
  const liveUrl = parseLiveUrl(obj.value.liveUrl, path);
  if (!liveUrl.ok) return liveUrl;
  return ok({
    id: id.value,
    runId: runId.value,
    type: type.value,
    status: status.value,
    startedAt: startedAt.value,
    durationMs: durationMs.value,
    models: models.value,
    verdict: verdict.value,
    liveUrl: liveUrl.value,
  });
}

function parseNumberList(value: unknown, label: string): Result<number[], Error> {
  const raw = asArray(value, label);
  if (!raw.ok) return raw;
  const out: number[] = [];
  for (let index = 0; index < raw.value.length; index += 1) {
    const item = asSafeInteger(raw.value[index], `${label}[${index}]`);
    if (!item.ok) return item;
    out.push(item.value);
  }
  return ok(out);
}

function parseStringList(value: unknown, label: string): Result<string[], Error> {
  const raw = asArray(value, label);
  if (!raw.ok) return raw;
  const out: string[] = [];
  for (let index = 0; index < raw.value.length; index += 1) {
    const item = asString(raw.value[index], `${label}[${index}]`);
    if (!item.ok) return item;
    out.push(item.value);
  }
  return ok(out);
}

function parseIssue(value: unknown, index: number): Result<GatedIssue, Error> {
  const label = `issues[${index}]`;
  const obj = requiredObject(value, ISSUE_KEYS, label);
  if (!obj.ok) return obj;
  const number = asSafeInteger(obj.value.number, `${label}.number`);
  if (!number.ok) return number;
  const title = asString(obj.value.title, `${label}.title`);
  if (!title.ok) return title;
  const state = asOneOf<IssueState>(obj.value.state, ISSUE_STATES, `${label}.state`);
  if (!state.ok) return state;
  const pullRequests = parseNumberList(obj.value.pullRequests, `${label}.pullRequests`);
  if (!pullRequests.ok) return pullRequests;
  const lastRunAt = asString(obj.value.lastRunAt, `${label}.lastRunAt`);
  if (!lastRunAt.ok) return lastRunAt;
  const entriesRaw = asArray(obj.value.entries, `${label}.entries`);
  if (!entriesRaw.ok) return entriesRaw;
  const entries = mapItems(entriesRaw.value, (item, entryIndex) =>
    parseEntry(item, entryIndex, `${label}.entries`),
  );
  if (!entries.ok) return entries;
  const visibility = parseVisibility(obj.value.visibility, label);
  if (!visibility.ok) return visibility;
  const issue: IssueRecord = {
    number: number.value,
    title: title.value,
    state: state.value,
    pullRequests: pullRequests.value,
    lastRunAt: lastRunAt.value,
    entries: entries.value,
  };
  return ok(
    visibility.value === undefined ? issue : { ...issue, visibility: visibility.value },
  );
}

function parsePullRequest(value: unknown, index: number): Result<GatedPullRequest, Error> {
  const label = `pullRequests[${index}]`;
  const obj = requiredObject(value, PR_KEYS, label);
  if (!obj.ok) return obj;
  const number = asSafeInteger(obj.value.number, `${label}.number`);
  if (!number.ok) return number;
  const issueNumber = asNullOr(obj.value.issueNumber, (inner) =>
    asSafeInteger(inner, `${label}.issueNumber`),
  );
  if (!issueNumber.ok) return issueNumber;
  const runIds = parseStringList(obj.value.runIds, `${label}.runIds`);
  if (!runIds.ok) return runIds;
  let entries: TimelineEntry[] = [];
  if (obj.value.entries !== undefined) {
    const entriesRaw = asArray(obj.value.entries, `${label}.entries`);
    if (!entriesRaw.ok) return entriesRaw;
    const parsed = mapItems(entriesRaw.value, (item, entryIndex) =>
      parseEntry(item, entryIndex, `${label}.entries`),
    );
    if (!parsed.ok) return parsed;
    entries = parsed.value;
  } else if (issueNumber.value === null) {
    return fail(`${label}.entries is required when issueNumber is null`);
  }
  const visibility = parseVisibility(obj.value.visibility, label);
  if (!visibility.ok) return visibility;
  const row: PullRequestIndexEntry = {
    number: number.value,
    issueNumber: issueNumber.value,
    runIds: runIds.value,
    entries,
  };
  return ok(visibility.value === undefined ? row : { ...row, visibility: visibility.value });
}

/** Parse a version-1 issue↔PR↔run index. Extra keys are ignored so a denser payload can sit in the same file. */
export function parsePublicReviewSnapshot(value: unknown): Result<GatedIndex, Error> {
  const wrapper = requiredObject(value, WRAPPER_KEYS, "snapshot");
  if (!wrapper.ok) return wrapper;
  if (wrapper.value.version !== 1) return fail("snapshot.version must be 1");
  const kind = asString(wrapper.value.kind, "snapshot.kind");
  if (!kind.ok) return kind;
  const issuesRaw = asArray(wrapper.value.issues, "snapshot.issues");
  if (!issuesRaw.ok) return issuesRaw;
  const issues = mapItems(issuesRaw.value, parseIssue);
  if (!issues.ok) return issues;
  const pullRequestsRaw = asArray(wrapper.value.pullRequests, "snapshot.pullRequests");
  if (!pullRequestsRaw.ok) return pullRequestsRaw;
  const pullRequests = mapItems(pullRequestsRaw.value, parsePullRequest);
  if (!pullRequests.ok) return pullRequests;
  return ok({
    version: 1,
    kind: kind.value,
    issues: issues.value,
    pullRequests: pullRequests.value,
  });
}
