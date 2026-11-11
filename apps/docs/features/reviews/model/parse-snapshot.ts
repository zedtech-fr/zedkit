import { err, ok, type Result } from "@zedtech/zedkit-core";

import type {
  FindingDisposition,
  ReviewAction,
  ReviewAgentSummary,
  ReviewConsoleItem,
  ReviewConsoleKind,
  ReviewFinding,
  ReviewPrState,
  ReviewRecord,
  ReviewRun,
  ReviewRunStatus,
  ReviewVerdict,
  ReviewVisibility,
} from "../ports/review-port";

const WRAPPER_KEYS = ["version", "kind", "reviews"] as const;
const RECORD_KEYS = [
  "number",
  "title",
  "verdict",
  "confidence",
  "status",
  "headSha",
  "lastRunAt",
  "prState",
  "visibility",
  "notes",
  "actions",
  "findings",
  "runs",
] as const;
const ACTION_KEYS = ["title", "detail"] as const;
const FINDING_KEYS = ["id", "summary", "disposition"] as const;
const AGENT_KEYS = ["id", "name", "kind", "status", "model"] as const;
const RUN_KEYS = ["id", "status", "startedAt", "agents"] as const;
const RUN_OPTIONAL_KEYS = ["items"] as const;
const CONSOLE_ITEM_KEYS = ["id", "kind", "title", "status"] as const;
const VERDICTS = ["approve", "request-changes", "comment", "error"] as const;
const RUN_STATUSES = ["running", "done", "error"] as const;
const PR_STATES = ["open", "merged"] as const;
const VISIBILITIES = ["public", "private"] as const;
const DISPOSITIONS = ["kept", "downgraded", "dismissed"] as const;
const CONSOLE_KINDS = ["flow", "agent", "workflow"] as const;

function fail(message: string): Result<never, Error> {
  return err(new Error(message));
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

function parseAction(value: unknown, index: number): Result<ReviewAction, Error> {
  const label = `actions[${index}]`;
  const obj = exactObject(value, ACTION_KEYS, label);
  if (!obj.ok) return obj;
  const title = asString(obj.value.title, `${label}.title`);
  if (!title.ok) return title;
  const detail = asString(obj.value.detail, `${label}.detail`);
  if (!detail.ok) return detail;
  return ok({ title: title.value, detail: detail.value });
}

function parseFinding(value: unknown, index: number): Result<ReviewFinding, Error> {
  const label = `findings[${index}]`;
  const obj = exactObject(value, FINDING_KEYS, label);
  if (!obj.ok) return obj;
  const id = asString(obj.value.id, `${label}.id`);
  if (!id.ok) return id;
  const summary = asString(obj.value.summary, `${label}.summary`);
  if (!summary.ok) return summary;
  const disposition = asOneOf<FindingDisposition>(
    obj.value.disposition,
    DISPOSITIONS,
    `${label}.disposition`,
  );
  if (!disposition.ok) return disposition;
  return ok({ id: id.value, summary: summary.value, disposition: disposition.value });
}

function parseAgent(value: unknown, index: number): Result<ReviewAgentSummary, Error> {
  const label = `agents[${index}]`;
  const obj = exactObject(value, AGENT_KEYS, label);
  if (!obj.ok) return obj;
  const id = asString(obj.value.id, `${label}.id`);
  if (!id.ok) return id;
  const name = asString(obj.value.name, `${label}.name`);
  if (!name.ok) return name;
  const kind = asString(obj.value.kind, `${label}.kind`);
  if (!kind.ok) return kind;
  const status = asString(obj.value.status, `${label}.status`);
  if (!status.ok) return status;
  const model = asString(obj.value.model, `${label}.model`);
  if (!model.ok) return model;
  return ok({
    id: id.value,
    name: name.value,
    kind: kind.value,
    status: status.value,
    model: model.value,
  });
}

function parseConsoleItem(value: unknown, index: number): Result<ReviewConsoleItem, Error> {
  const label = `items[${index}]`;
  const obj = exactObject(value, CONSOLE_ITEM_KEYS, label);
  if (!obj.ok) return obj;
  const id = asString(obj.value.id, `${label}.id`);
  if (!id.ok) return id;
  const kind = asOneOf<ReviewConsoleKind>(obj.value.kind, CONSOLE_KINDS, `${label}.kind`);
  if (!kind.ok) return kind;
  const title = asString(obj.value.title, `${label}.title`);
  if (!title.ok) return title;
  const status = asOneOf<ReviewRunStatus>(obj.value.status, RUN_STATUSES, `${label}.status`);
  if (!status.ok) return status;
  return ok({
    id: id.value,
    kind: kind.value,
    title: title.value,
    status: status.value,
  });
}

function parseRun(value: unknown, index: number): Result<ReviewRun, Error> {
  const label = `runs[${index}]`;
  const obj = exactObject(value, RUN_KEYS, label, RUN_OPTIONAL_KEYS);
  if (!obj.ok) return obj;
  const id = asString(obj.value.id, `${label}.id`);
  if (!id.ok) return id;
  const status = asOneOf<ReviewRunStatus>(obj.value.status, RUN_STATUSES, `${label}.status`);
  if (!status.ok) return status;
  const startedAt = asString(obj.value.startedAt, `${label}.startedAt`);
  if (!startedAt.ok) return startedAt;
  const agentsRaw = asArray(obj.value.agents, `${label}.agents`);
  if (!agentsRaw.ok) return agentsRaw;
  const agents = mapItems(agentsRaw.value, parseAgent);
  if (!agents.ok) return agents;
  const run: ReviewRun = {
    id: id.value,
    status: status.value,
    startedAt: startedAt.value,
    agents: agents.value,
  };
  if (obj.value.items === undefined) return ok(run);
  const itemsRaw = asArray(obj.value.items, `${label}.items`);
  if (!itemsRaw.ok) return itemsRaw;
  const items = mapItems(itemsRaw.value, parseConsoleItem);
  if (!items.ok) return items;
  return ok({ ...run, items: items.value });
}

function parseRecordCore(
  obj: Record<string, unknown>,
  label: string,
): Result<
  Pick<
    ReviewRecord,
    | "number"
    | "title"
    | "verdict"
    | "confidence"
    | "status"
    | "headSha"
    | "lastRunAt"
    | "prState"
    | "visibility"
    | "notes"
  >,
  Error
> {
  if (typeof obj.number !== "number" || !Number.isSafeInteger(obj.number)) {
    return fail(`${label}.number must be a safe integer`);
  }
  const title = asString(obj.title, `${label}.title`);
  if (!title.ok) return title;
  const verdict = asOneOf<ReviewVerdict>(obj.verdict, VERDICTS, `${label}.verdict`);
  if (!verdict.ok) return verdict;
  if (typeof obj.confidence !== "number" || !Number.isFinite(obj.confidence)) {
    return fail(`${label}.confidence must be a finite number`);
  }
  const status = asOneOf<ReviewRunStatus>(obj.status, RUN_STATUSES, `${label}.status`);
  if (!status.ok) return status;
  const headSha = asString(obj.headSha, `${label}.headSha`);
  if (!headSha.ok) return headSha;
  const lastRunAt = asString(obj.lastRunAt, `${label}.lastRunAt`);
  if (!lastRunAt.ok) return lastRunAt;
  const prState = asOneOf<ReviewPrState>(obj.prState, PR_STATES, `${label}.prState`);
  if (!prState.ok) return prState;
  const visibility = asOneOf<ReviewVisibility>(
    obj.visibility,
    VISIBILITIES,
    `${label}.visibility`,
  );
  if (!visibility.ok) return visibility;
  const notes = asString(obj.notes, `${label}.notes`);
  if (!notes.ok) return notes;
  return ok({
    number: obj.number,
    title: title.value,
    verdict: verdict.value,
    confidence: obj.confidence,
    status: status.value,
    headSha: headSha.value,
    lastRunAt: lastRunAt.value,
    prState: prState.value,
    visibility: visibility.value,
    notes: notes.value,
  });
}

function parseRecordLists(
  obj: Record<string, unknown>,
  label: string,
): Result<Pick<ReviewRecord, "actions" | "findings" | "runs">, Error> {
  const actionsRaw = asArray(obj.actions, `${label}.actions`);
  if (!actionsRaw.ok) return actionsRaw;
  const actions = mapItems(actionsRaw.value, parseAction);
  if (!actions.ok) return actions;
  const findingsRaw = asArray(obj.findings, `${label}.findings`);
  if (!findingsRaw.ok) return findingsRaw;
  const findings = mapItems(findingsRaw.value, parseFinding);
  if (!findings.ok) return findings;
  const runsRaw = asArray(obj.runs, `${label}.runs`);
  if (!runsRaw.ok) return runsRaw;
  const runs = mapItems(runsRaw.value, parseRun);
  if (!runs.ok) return runs;
  return ok({ actions: actions.value, findings: findings.value, runs: runs.value });
}

function parseRecord(value: unknown, index: number): Result<ReviewRecord, Error> {
  const label = `reviews[${index}]`;
  const obj = exactObject(value, RECORD_KEYS, label);
  if (!obj.ok) return obj;
  const core = parseRecordCore(obj.value, label);
  if (!core.ok) return core;
  const lists = parseRecordLists(obj.value, label);
  if (!lists.ok) return lists;
  return ok({ ...core.value, ...lists.value });
}

/** Parse a version-1 public review snapshot. Fail closed on unknown shape. */
export function parsePublicReviewSnapshot(value: unknown): Result<ReviewRecord[], Error> {
  const wrapper = exactObject(value, WRAPPER_KEYS, "snapshot");
  if (!wrapper.ok) return wrapper;
  if (wrapper.value.version !== 1) return fail("snapshot.version must be 1");
  const kind = asString(wrapper.value.kind, "snapshot.kind");
  if (!kind.ok) return kind;
  const reviewsRaw = asArray(wrapper.value.reviews, "snapshot.reviews");
  if (!reviewsRaw.ok) return reviewsRaw;
  return mapItems(reviewsRaw.value, parseRecord);
}
