import { err, ok, type Result } from "@zedtech/zedkit-core";

import type {
  IssueRecord,
  IssueState,
  LiveDecision,
  LiveDecisionItem,
  LiveEntry,
  LiveItemDetail,
  LiveRelatedRun,
  LiveRunInfo,
  LiveSecondPassResult,
  LiveVerdict,
  PublicLiveRun,
  PullRequestIndexEntry,
  ReviewVerdict,
  ReviewVisibility,
  TimelineEntry,
  TimelineEntryStatus,
  TimelineEntryType,
} from "../ports/review-port";
import {
  RUN_ID_PATTERN,
  type GatedIndex,
  type GatedIssue,
  type GatedPullRequest,
  type VisibilityField,
} from "./public-review.ts";

export type ParsedPublicReviewSnapshot = GatedIndex | PublicLiveRun[];

const LIVE_WRAPPER_KEYS = ["version", "kind", "reviews"] as const;
const INDEX_WRAPPER_KEYS = ["version", "kind", "issues", "pullRequests"] as const;
const ISSUE_KEYS = ["number", "title", "state", "pullRequests", "lastRunAt", "entries"] as const;
const INDEX_ENTRY_KEYS = [
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
const LIVE_ROW_KEYS = ["visibility", "decision", "run", "items", "verdict_json", "related"] as const;
const VISIBILITIES = ["public", "private"] as const;
const RUN_KEYS = ["run_id", "status", "engine", "engine_label", "created_at", "server_now"] as const;
const RUN_OPTIONAL_KEYS = [
  "pr",
  "sha",
  "repo",
  "mode",
  "elapsed_s",
  "verdict",
  "confidence_score",
  "review_url",
  "pr_url",
  "review_size",
  "prior_sha",
  "model_validation_ok",
  "target_label",
  "kind",
  "branch",
  "opened_pr_url",
  "issue_title",
  "issue",
  "live_url",
] as const;
const ITEM_KEYS = [
  "id",
  "name",
  "kind",
  "engine",
  "engine_label",
  "model",
  "status",
  "tool_count",
  "message_count",
  "tokens_in",
  "tokens_out",
] as const;
const ITEM_OPTIONAL_KEYS = [
  "started_ms",
  "ended_ms",
  "duration_s",
  "last_activity_ms",
  "last_activity",
  "dropped",
  "independent",
  "entries",
  "prompt",
  "final_text",
  "result",
] as const;
const LIVE_ENTRY_KEYS = ["type"] as const;
const LIVE_ENTRY_OPTIONAL_KEYS = [
  "ts",
  "text",
  "phase",
  "live",
  "id",
  "tool",
  "label",
  "args",
  "status",
  "output",
  "output_chars",
  "duration_ms",
] as const;
const DECISION_KEYS = ["posted", "must", "notes", "dismissed", "degraded", "enforcement_reasons"] as const;
const DECISION_OPTIONAL_KEYS = [
  "verdict",
  "confidence_score",
  "review_url",
  "summary",
  "reconcile",
  "reconcile_reason",
  "second_pass",
  "first_pass",
] as const;
const DECISION_ITEM_KEYS = ["text"] as const;
const DECISION_ITEM_OPTIONAL_KEYS = ["tag"] as const;
const RELATED_KEYS = ["run_id"] as const;
const RELATED_OPTIONAL_KEYS = [
  "mode",
  "status",
  "sha",
  "created_at",
  "verdict",
  "confidence_score",
  "engine_label",
  "duration_s",
] as const;

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

function exactObject(
  value: unknown,
  keys: readonly string[],
  label: string,
  optional: readonly string[] = [],
): Result<Record<string, unknown>, Error> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return fail(`${label} must be an object`);
  }
  const record = value as Record<string, unknown>;
  const actual = Object.keys(record);
  const allowed = [...keys, ...optional];
  const extra = actual.filter((key) => !allowed.includes(key));
  if (extra.length > 0) return fail(`${label} has unknown keys: ${extra.join(", ")}`);
  const missing = keys.filter((key) => !actual.includes(key));
  if (missing.length > 0) return fail(`${label} is missing ${missing.join(", ")}`);
  return ok(record);
}

function asString(value: unknown, label: string): Result<string, Error> {
  if (typeof value !== "string") return fail(`${label} must be a string`);
  return ok(value);
}

function asRunId(value: unknown, label: string): Result<string, Error> {
  const text = asString(value, label);
  if (!text.ok) return text;
  if (!RUN_ID_PATTERN.test(text.value)) {
    return fail(`${label} must be a run id`);
  }
  return ok(text.value);
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

function asBoolean(value: unknown, label: string): Result<boolean, Error> {
  if (typeof value !== "boolean") return fail(`${label} must be a boolean`);
  return ok(value);
}

function asFiniteNumber(value: unknown, label: string): Result<number, Error> {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fail(`${label} must be a finite number`);
  }
  return ok(value);
}

function asNullableString(value: unknown, label: string): Result<string | null, Error> {
  if (value === null) return ok(null);
  return asString(value, label);
}

function asNullableFiniteNumber(value: unknown, label: string): Result<number | null, Error> {
  if (value === null) return ok(null);
  return asFiniteNumber(value, label);
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

function parseStringRecord(value: unknown, label: string): Result<Record<string, string>, Error> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return fail(`${label} must be an object`);
  }
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry !== "string") return fail(`${label}.${key} must be a string`);
    out[key] = entry;
  }
  return ok(out);
}

function parseLiveEntry(value: unknown, index: number): Result<LiveEntry, Error> {
  const label = `entries[${index}]`;
  const obj = exactObject(value, LIVE_ENTRY_KEYS, label, LIVE_ENTRY_OPTIONAL_KEYS);
  if (!obj.ok) return obj;
  const type = asString(obj.value.type, `${label}.type`);
  if (!type.ok) return type;
  const entry: LiveEntry = { type: type.value };
  if (obj.value.ts !== undefined) {
    const ts = asNullableFiniteNumber(obj.value.ts, `${label}.ts`);
    if (!ts.ok) return ts;
    Object.assign(entry, { ts: ts.value });
  }
  if (obj.value.text !== undefined) {
    const text = asString(obj.value.text, `${label}.text`);
    if (!text.ok) return text;
    Object.assign(entry, { text: text.value });
  }
  if (obj.value.phase !== undefined) {
    const phase = asNullableString(obj.value.phase, `${label}.phase`);
    if (!phase.ok) return phase;
    Object.assign(entry, { phase: phase.value });
  }
  if (obj.value.live !== undefined) {
    const live = asBoolean(obj.value.live, `${label}.live`);
    if (!live.ok) return live;
    Object.assign(entry, { live: live.value });
  }
  if (obj.value.id !== undefined) {
    const id = asString(obj.value.id, `${label}.id`);
    if (!id.ok) return id;
    Object.assign(entry, { id: id.value });
  }
  if (obj.value.tool !== undefined) {
    const tool = asString(obj.value.tool, `${label}.tool`);
    if (!tool.ok) return tool;
    Object.assign(entry, { tool: tool.value });
  }
  if (obj.value.label !== undefined) {
    const labelText = asString(obj.value.label, `${label}.label`);
    if (!labelText.ok) return labelText;
    Object.assign(entry, { label: labelText.value });
  }
  if (obj.value.args !== undefined) {
    const args = parseStringRecord(obj.value.args, `${label}.args`);
    if (!args.ok) return args;
    Object.assign(entry, { args: args.value });
  }
  if (obj.value.status !== undefined) {
    const status = asString(obj.value.status, `${label}.status`);
    if (!status.ok) return status;
    Object.assign(entry, { status: status.value });
  }
  if (obj.value.output !== undefined) {
    if (obj.value.output !== null && typeof obj.value.output !== "string") {
      return fail(`${label}.output must be a string or null`);
    }
    Object.assign(entry, { output: obj.value.output });
  }
  if (obj.value.output_chars !== undefined) {
    const chars = asFiniteNumber(obj.value.output_chars, `${label}.output_chars`);
    if (!chars.ok) return chars;
    Object.assign(entry, { output_chars: chars.value });
  }
  if (obj.value.duration_ms !== undefined) {
    const duration = asNullableFiniteNumber(obj.value.duration_ms, `${label}.duration_ms`);
    if (!duration.ok) return duration;
    Object.assign(entry, { duration_ms: duration.value });
  }
  return ok(entry);
}

function parseSecondPassResult(value: unknown, label: string): Result<LiveSecondPassResult, Error> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return fail(`${label} must be an object`);
  }
  return ok(value as LiveSecondPassResult);
}

function parseItem(value: unknown, index: number): Result<LiveItemDetail, Error> {
  const label = `items[${index}]`;
  const obj = exactObject(value, ITEM_KEYS, label, ITEM_OPTIONAL_KEYS);
  if (!obj.ok) return obj;
  const id = asString(obj.value.id, `${label}.id`);
  if (!id.ok) return id;
  const name = asString(obj.value.name, `${label}.name`);
  if (!name.ok) return name;
  const kind = asString(obj.value.kind, `${label}.kind`);
  if (!kind.ok) return kind;
  const engine = asString(obj.value.engine, `${label}.engine`);
  if (!engine.ok) return engine;
  const engineLabel = asString(obj.value.engine_label, `${label}.engine_label`);
  if (!engineLabel.ok) return engineLabel;
  const model = asString(obj.value.model, `${label}.model`);
  if (!model.ok) return model;
  const status = asString(obj.value.status, `${label}.status`);
  if (!status.ok) return status;
  const toolCount = asFiniteNumber(obj.value.tool_count, `${label}.tool_count`);
  if (!toolCount.ok) return toolCount;
  const messageCount = asFiniteNumber(obj.value.message_count, `${label}.message_count`);
  if (!messageCount.ok) return messageCount;
  const tokensIn = asFiniteNumber(obj.value.tokens_in, `${label}.tokens_in`);
  if (!tokensIn.ok) return tokensIn;
  const tokensOut = asFiniteNumber(obj.value.tokens_out, `${label}.tokens_out`);
  if (!tokensOut.ok) return tokensOut;
  const item: LiveItemDetail = {
    id: id.value,
    name: name.value,
    kind: kind.value,
    engine: engine.value,
    engine_label: engineLabel.value,
    model: model.value,
    status: status.value,
    tool_count: toolCount.value,
    message_count: messageCount.value,
    tokens_in: tokensIn.value,
    tokens_out: tokensOut.value,
    entries: [],
    prompt: "",
    final_text: "",
  };
  if (obj.value.started_ms !== undefined) {
    const started = asNullableFiniteNumber(obj.value.started_ms, `${label}.started_ms`);
    if (!started.ok) return started;
    Object.assign(item, { started_ms: started.value });
  }
  if (obj.value.ended_ms !== undefined) {
    const ended = asNullableFiniteNumber(obj.value.ended_ms, `${label}.ended_ms`);
    if (!ended.ok) return ended;
    Object.assign(item, { ended_ms: ended.value });
  }
  if (obj.value.duration_s !== undefined) {
    const duration = asNullableFiniteNumber(obj.value.duration_s, `${label}.duration_s`);
    if (!duration.ok) return duration;
    Object.assign(item, { duration_s: duration.value });
  }
  if (obj.value.last_activity_ms !== undefined) {
    const last = asNullableFiniteNumber(obj.value.last_activity_ms, `${label}.last_activity_ms`);
    if (!last.ok) return last;
    Object.assign(item, { last_activity_ms: last.value });
  }
  if (obj.value.last_activity !== undefined) {
    const last = asNullableString(obj.value.last_activity, `${label}.last_activity`);
    if (!last.ok) return last;
    Object.assign(item, { last_activity: last.value });
  }
  if (obj.value.dropped !== undefined) {
    const dropped = asFiniteNumber(obj.value.dropped, `${label}.dropped`);
    if (!dropped.ok) return dropped;
    Object.assign(item, { dropped: dropped.value });
  }
  if (obj.value.independent !== undefined) {
    if (obj.value.independent !== null && typeof obj.value.independent !== "boolean") {
      return fail(`${label}.independent must be a boolean or null`);
    }
    Object.assign(item, { independent: obj.value.independent });
  }
  if (obj.value.entries !== undefined) {
    const entriesRaw = asArray(obj.value.entries, `${label}.entries`);
    if (!entriesRaw.ok) return entriesRaw;
    const entries = mapItems(entriesRaw.value, parseLiveEntry);
    if (!entries.ok) return entries;
    Object.assign(item, { entries: entries.value });
  }
  if (obj.value.prompt !== undefined) {
    const prompt = asString(obj.value.prompt, `${label}.prompt`);
    if (!prompt.ok) return prompt;
    Object.assign(item, { prompt: prompt.value });
  }
  if (obj.value.final_text !== undefined) {
    const finalText = asString(obj.value.final_text, `${label}.final_text`);
    if (!finalText.ok) return finalText;
    Object.assign(item, { final_text: finalText.value });
  }
  if (obj.value.result !== undefined) {
    const result = parseSecondPassResult(obj.value.result, `${label}.result`);
    if (!result.ok) return result;
    Object.assign(item, { result: result.value });
  }
  return ok(item);
}

function parseRunInfo(value: unknown, label: string): Result<LiveRunInfo, Error> {
  const obj = exactObject(value, RUN_KEYS, label, RUN_OPTIONAL_KEYS);
  if (!obj.ok) return obj;
  const runId = asRunId(obj.value.run_id, `${label}.run_id`);
  if (!runId.ok) return runId;
  const status = asString(obj.value.status, `${label}.status`);
  if (!status.ok) return status;
  const engine = asString(obj.value.engine, `${label}.engine`);
  if (!engine.ok) return engine;
  const engineLabel = asString(obj.value.engine_label, `${label}.engine_label`);
  if (!engineLabel.ok) return engineLabel;
  const createdAt = asFiniteNumber(obj.value.created_at, `${label}.created_at`);
  if (!createdAt.ok) return createdAt;
  const serverNow = asFiniteNumber(obj.value.server_now, `${label}.server_now`);
  if (!serverNow.ok) return serverNow;
  const run: LiveRunInfo = {
    run_id: runId.value,
    status: status.value,
    engine: engine.value,
    engine_label: engineLabel.value,
    created_at: createdAt.value,
    server_now: serverNow.value,
  };
  if (obj.value.pr !== undefined) {
    if (obj.value.pr !== null && (typeof obj.value.pr !== "number" || !Number.isSafeInteger(obj.value.pr))) {
      return fail(`${label}.pr must be a safe integer or null`);
    }
    Object.assign(run, { pr: obj.value.pr });
  }
  if (obj.value.issue !== undefined) {
    if (
      obj.value.issue !== null &&
      (typeof obj.value.issue !== "number" || !Number.isSafeInteger(obj.value.issue))
    ) {
      return fail(`${label}.issue must be a safe integer or null`);
    }
    Object.assign(run, { issue: obj.value.issue });
  }
  const optionals: Array<[string, (v: unknown, l: string) => Result<unknown, Error>]> = [
    ["sha", asNullableString],
    ["repo", asString],
    ["mode", asNullableString],
    ["elapsed_s", asNullableFiniteNumber],
    ["verdict", asNullableString],
    ["confidence_score", asNullableFiniteNumber],
    ["review_url", asNullableString],
    ["pr_url", asNullableString],
    ["review_size", asNullableString],
    ["prior_sha", asNullableString],
    ["target_label", asNullableString],
    ["kind", asNullableString],
    ["branch", asNullableString],
    ["opened_pr_url", asNullableString],
    ["issue_title", asNullableString],
    ["live_url", asNullableString],
  ];
  for (const [key, parse] of optionals) {
    if (obj.value[key] === undefined) continue;
    const parsed = parse(obj.value[key], `${label}.${key}`);
    if (!parsed.ok) return parsed;
    Object.assign(run, { [key]: parsed.value });
  }
  if (obj.value.model_validation_ok !== undefined) {
    if (obj.value.model_validation_ok !== null && typeof obj.value.model_validation_ok !== "boolean") {
      return fail(`${label}.model_validation_ok must be a boolean or null`);
    }
    Object.assign(run, { model_validation_ok: obj.value.model_validation_ok });
  }
  return ok(run);
}

function parseDecisionItem(value: unknown, index: number): Result<LiveDecisionItem, Error> {
  const label = `must_or_notes[${index}]`;
  const obj = exactObject(value, DECISION_ITEM_KEYS, label, DECISION_ITEM_OPTIONAL_KEYS);
  if (!obj.ok) return obj;
  const text = asString(obj.value.text, `${label}.text`);
  if (!text.ok) return text;
  if (obj.value.tag === undefined) return ok({ text: text.value });
  if (obj.value.tag !== null && obj.value.tag !== "downgraded" && obj.value.tag !== "approved") {
    return fail(`${label}.tag must be downgraded|approved|null`);
  }
  return ok({ text: text.value, tag: obj.value.tag });
}

function parseDecision(value: unknown, label: string): Result<LiveDecision | null, Error> {
  if (value === null) return ok(null);
  const obj = exactObject(value, DECISION_KEYS, label, DECISION_OPTIONAL_KEYS);
  if (!obj.ok) return obj;
  const posted = asBoolean(obj.value.posted, `${label}.posted`);
  if (!posted.ok) return posted;
  const mustRaw = asArray(obj.value.must, `${label}.must`);
  if (!mustRaw.ok) return mustRaw;
  const must = mapItems(mustRaw.value, parseDecisionItem);
  if (!must.ok) return must;
  const notesRaw = asArray(obj.value.notes, `${label}.notes`);
  if (!notesRaw.ok) return notesRaw;
  const notes = mapItems(notesRaw.value, parseDecisionItem);
  if (!notes.ok) return notes;
  const dismissedRaw = asArray(obj.value.dismissed, `${label}.dismissed`);
  if (!dismissedRaw.ok) return dismissedRaw;
  const dismissed: string[] = [];
  for (let index = 0; index < dismissedRaw.value.length; index += 1) {
    const item = asString(dismissedRaw.value[index], `${label}.dismissed[${index}]`);
    if (!item.ok) return item;
    dismissed.push(item.value);
  }
  const degraded = asBoolean(obj.value.degraded, `${label}.degraded`);
  if (!degraded.ok) return degraded;
  const reasonsRaw = asArray(obj.value.enforcement_reasons, `${label}.enforcement_reasons`);
  if (!reasonsRaw.ok) return reasonsRaw;
  const reasons: string[] = [];
  for (let index = 0; index < reasonsRaw.value.length; index += 1) {
    const item = asString(reasonsRaw.value[index], `${label}.enforcement_reasons[${index}]`);
    if (!item.ok) return item;
    reasons.push(item.value);
  }
  const decision: LiveDecision = {
    posted: posted.value,
    must: must.value,
    notes: notes.value,
    dismissed,
    degraded: degraded.value,
    enforcement_reasons: reasons,
  };
  if (obj.value.verdict !== undefined) {
    const verdict = asNullableString(obj.value.verdict, `${label}.verdict`);
    if (!verdict.ok) return verdict;
    Object.assign(decision, { verdict: verdict.value });
  }
  if (obj.value.confidence_score !== undefined) {
    const score = asNullableFiniteNumber(obj.value.confidence_score, `${label}.confidence_score`);
    if (!score.ok) return score;
    Object.assign(decision, { confidence_score: score.value });
  }
  if (obj.value.review_url !== undefined) {
    const url = asNullableString(obj.value.review_url, `${label}.review_url`);
    if (!url.ok) return url;
    Object.assign(decision, { review_url: url.value });
  }
  if (obj.value.summary !== undefined) {
    const summary = asNullableString(obj.value.summary, `${label}.summary`);
    if (!summary.ok) return summary;
    Object.assign(decision, { summary: summary.value });
  }
  if (obj.value.reconcile !== undefined) {
    if (obj.value.reconcile === null || typeof obj.value.reconcile !== "object" || Array.isArray(obj.value.reconcile)) {
      return fail(`${label}.reconcile must be an object`);
    }
    Object.assign(decision, { reconcile: obj.value.reconcile as Record<string, unknown> });
  }
  if (obj.value.reconcile_reason !== undefined) {
    const reason = asNullableString(obj.value.reconcile_reason, `${label}.reconcile_reason`);
    if (!reason.ok) return reason;
    Object.assign(decision, { reconcile_reason: reason.value });
  }
  if (obj.value.second_pass !== undefined) {
    if (obj.value.second_pass !== null && (typeof obj.value.second_pass !== "object" || Array.isArray(obj.value.second_pass))) {
      return fail(`${label}.second_pass must be an object or null`);
    }
    Object.assign(decision, { second_pass: obj.value.second_pass as Record<string, unknown> | null });
  }
  if (obj.value.first_pass !== undefined) {
    if (obj.value.first_pass !== null && (typeof obj.value.first_pass !== "object" || Array.isArray(obj.value.first_pass))) {
      return fail(`${label}.first_pass must be an object or null`);
    }
    Object.assign(decision, { first_pass: obj.value.first_pass as Record<string, unknown> | null });
  }
  return ok(decision);
}

function parseVerdict(value: unknown, label: string): Result<LiveVerdict | null, Error> {
  if (value === null) return ok(null);
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return fail(`${label} must be an object`);
  }
  return ok(value as LiveVerdict);
}

function parseRelated(value: unknown, index: number): Result<LiveRelatedRun, Error> {
  const label = `related[${index}]`;
  const obj = exactObject(value, RELATED_KEYS, label, RELATED_OPTIONAL_KEYS);
  if (!obj.ok) return obj;
  const runId = asRunId(obj.value.run_id, `${label}.run_id`);
  if (!runId.ok) return runId;
  const related: LiveRelatedRun = { run_id: runId.value };
  const strings: Array<"mode" | "status" | "sha"> = ["mode", "status", "sha"];
  for (const key of strings) {
    if (obj.value[key] === undefined) continue;
    const parsed = asString(obj.value[key], `${label}.${key}`);
    if (!parsed.ok) return parsed;
    Object.assign(related, { [key]: parsed.value });
  }
  if (obj.value.created_at !== undefined) {
    const created = asFiniteNumber(obj.value.created_at, `${label}.created_at`);
    if (!created.ok) return created;
    Object.assign(related, { created_at: created.value });
  }
  if (obj.value.verdict !== undefined) {
    const verdict = asNullableString(obj.value.verdict, `${label}.verdict`);
    if (!verdict.ok) return verdict;
    Object.assign(related, { verdict: verdict.value });
  }
  if (obj.value.confidence_score !== undefined) {
    const score = asNullableFiniteNumber(obj.value.confidence_score, `${label}.confidence_score`);
    if (!score.ok) return score;
    Object.assign(related, { confidence_score: score.value });
  }
  if (obj.value.engine_label !== undefined) {
    const engine = asNullableString(obj.value.engine_label, `${label}.engine_label`);
    if (!engine.ok) return engine;
    Object.assign(related, { engine_label: engine.value });
  }
  if (obj.value.duration_s !== undefined) {
    const duration = asNullableFiniteNumber(obj.value.duration_s, `${label}.duration_s`);
    if (!duration.ok) return duration;
    Object.assign(related, { duration_s: duration.value });
  }
  return ok(related);
}

function parseLiveRow(value: unknown, index: number): Result<PublicLiveRun, Error> {
  const label = `reviews[${index}]`;
  const obj = exactObject(value, LIVE_ROW_KEYS, label);
  if (!obj.ok) return obj;
  const visibility = asOneOf<ReviewVisibility>(obj.value.visibility, VISIBILITIES, `${label}.visibility`);
  if (!visibility.ok) return visibility;
  const decision = parseDecision(obj.value.decision, `${label}.decision`);
  if (!decision.ok) return decision;
  const run = parseRunInfo(obj.value.run, `${label}.run`);
  if (!run.ok) return run;
  const itemsRaw = asArray(obj.value.items, `${label}.items`);
  if (!itemsRaw.ok) return itemsRaw;
  const items = mapItems(itemsRaw.value, parseItem);
  if (!items.ok) return items;
  const verdict = parseVerdict(obj.value.verdict_json, `${label}.verdict_json`);
  if (!verdict.ok) return verdict;
  const relatedRaw = asArray(obj.value.related, `${label}.related`);
  if (!relatedRaw.ok) return relatedRaw;
  const related = mapItems(relatedRaw.value, parseRelated);
  if (!related.ok) return related;
  return ok({
    visibility: visibility.value,
    decision: decision.value,
    run: run.value,
    items: items.value,
    verdict_json: verdict.value,
    related: related.value,
  });
}

function parseIndexVisibility(value: unknown, label: string): Result<VisibilityField, Error> {
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

function parseIndexLiveUrl(value: unknown, label: string): Result<string | null, Error> {
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

function parseIndexEntry(value: unknown, index: number, label: string): Result<TimelineEntry, Error> {
  const path = `${label}[${index}]`;
  const obj = requiredObject(value, INDEX_ENTRY_KEYS, path);
  if (!obj.ok) return obj;
  const id = asString(obj.value.id, `${path}.id`);
  if (!id.ok) return id;
  const runId = asRunId(obj.value.runId, `${path}.runId`);
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
  const liveUrl = parseIndexLiveUrl(obj.value.liveUrl, path);
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

function parseRunIdList(value: unknown, label: string): Result<string[], Error> {
  const raw = asArray(value, label);
  if (!raw.ok) return raw;
  const out: string[] = [];
  for (let index = 0; index < raw.value.length; index += 1) {
    const item = asRunId(raw.value[index], `${label}[${index}]`);
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
    parseIndexEntry(item, entryIndex, `${label}.entries`),
  );
  if (!entries.ok) return entries;
  const visibility = parseIndexVisibility(obj.value.visibility, label);
  if (!visibility.ok) return visibility;
  const issue: IssueRecord = {
    number: number.value,
    title: title.value,
    state: state.value,
    pullRequests: pullRequests.value,
    lastRunAt: lastRunAt.value,
    entries: entries.value,
  };
  return ok(visibility.value === undefined ? issue : { ...issue, visibility: visibility.value });
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
  const runIds = parseRunIdList(obj.value.runIds, `${label}.runIds`);
  if (!runIds.ok) return runIds;
  let entries: TimelineEntry[] = [];
  if (obj.value.entries !== undefined) {
    const entriesRaw = asArray(obj.value.entries, `${label}.entries`);
    if (!entriesRaw.ok) return entriesRaw;
    const parsed = mapItems(entriesRaw.value, (item, entryIndex) =>
      parseIndexEntry(item, entryIndex, `${label}.entries`),
    );
    if (!parsed.ok) return parsed;
    entries = parsed.value;
  } else if (issueNumber.value === null) {
    return fail(`${label}.entries is required when issueNumber is null`);
  }
  const visibility = parseIndexVisibility(obj.value.visibility, label);
  if (!visibility.ok) return visibility;
  const row: PullRequestIndexEntry = {
    number: number.value,
    issueNumber: issueNumber.value,
    runIds: runIds.value,
    entries,
  };
  return ok(visibility.value === undefined ? row : { ...row, visibility: visibility.value });
}

function parseLiveSnapshot(value: unknown): Result<PublicLiveRun[], Error> {
  const wrapper = exactObject(value, LIVE_WRAPPER_KEYS, "snapshot");
  if (!wrapper.ok) return wrapper;
  if (wrapper.value.version !== 1) return fail("snapshot.version must be 1");
  const kind = asString(wrapper.value.kind, "snapshot.kind");
  if (!kind.ok) return kind;
  const reviewsRaw = asArray(wrapper.value.reviews, "snapshot.reviews");
  if (!reviewsRaw.ok) return reviewsRaw;
  return mapItems(reviewsRaw.value, parseLiveRow);
}

/** Parse a version-1 issue↔PR↔run index. Extra keys are ignored so a denser payload can sit in the same file. */
function parseIndexSnapshot(value: unknown): Result<GatedIndex, Error> {
  const wrapper = requiredObject(value, INDEX_WRAPPER_KEYS, "snapshot");
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

export function isLiveSnapshot(value: ParsedPublicReviewSnapshot): value is PublicLiveRun[] {
  return Array.isArray(value);
}

/** Parse a version-1 live-run snapshot or issue-centric index. See SNAPSHOT.md. */
export function parsePublicReviewSnapshot(value: unknown): Result<ParsedPublicReviewSnapshot, Error> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return fail("snapshot must be an object");
  }
  const record = value as Record<string, unknown>;
  if ("reviews" in record && !("issues" in record)) return parseLiveSnapshot(value);
  if ("issues" in record) return parseIndexSnapshot(value);
  return fail("snapshot is missing issues or reviews");
}
