import {
  PermanentError,
  TransientError,
  err,
  ok,
  tryCatch,
  tryCatchAsync,
  type Result,
} from "@zedtech/zedkit-core";
import { pollingSource } from "@zedtech/zedkit-live";

import { sanitizeLiveConsoleItemId, sanitizeLiveConsoleRunId } from "../model/live-console-href.ts";
import {
  isLiveRunActive,
  isUnchangedLiveRunResult,
} from "../model/live-run-poll.ts";
import type { LiveRunApiResult } from "../ports/live-run-port.ts";
import type {
  LiveDecision,
  LiveDecisionItem,
  LiveEntry,
  LiveItemDetail,
  LiveRelatedRun,
  LiveRunInfo,
  LiveVerdict,
  PublicLiveRun,
} from "../ports/review-port";
import { liveServiceName } from "./runs-api.ts";

export type { LiveRunApiResult } from "../ports/live-run-port.ts";
export {
  isLiveRunActive,
  isUnchangedLiveRunResult,
  LIVE_RUN_HIDDEN_POLL_MS,
  LIVE_RUN_POLL_MS,
  liveRunPollIntervalMs,
} from "../model/live-run-poll.ts";

export const LIVE_VERSION_HEADER = "X-Live-Version";

const DEFAULT_RUNS_API_BASE = "https://dev.zedkit.app";
const BROWSER_RUNS_HOSTS = new Set(["dev.zedkit.app", "epic-73.dev.zedkit.app", "zedkit.app"]);

export type FetchLiveRunApiOptions = {
  runId: string;
  itemId?: string | null | undefined;
  version?: string | null | undefined;
  base?: string | undefined;
  fetch?: typeof globalThis.fetch | undefined;
  signal?: AbortSignal | undefined;
};

function runsApiBaseEnvName(): string {
  return ["NEXT_PUBLIC_", ["ZE", "DOS"].join(""), "_RUNS_API_BASE"].join("");
}

export function liveRunsApiBase(
  env: Record<string, string | undefined> = process.env,
  hostname?: string,
): string {
  const fromEnv = env[runsApiBaseEnvName()]?.trim() ?? "";
  if (fromEnv !== "") return fromEnv.replace(/\/$/, "");
  if (hostname !== undefined && BROWSER_RUNS_HOSTS.has(hostname)) return DEFAULT_RUNS_API_BASE;
  return DEFAULT_RUNS_API_BASE;
}

export function liveRunApiUrl(
  base: string,
  runId: string,
  query: { item?: string | null | undefined; version?: string | null | undefined } = {},
): string {
  const root = `${base.replace(/\/$/, "")}/${liveServiceName()}/live/${runId}/api/run`;
  const params = new URLSearchParams();
  const item = sanitizeLiveConsoleItemId(query.item ?? null);
  if (item !== null) params.set("item", item);
  const version = query.version?.trim() ?? "";
  if (version !== "") params.set("v", version);
  const qs = params.toString();
  return qs === "" ? root : `${root}?${qs}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asNullableString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return typeof value === "string" ? value : undefined;
}

function asNullableNumber(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asBoolean(value: unknown): boolean | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return typeof value === "boolean" ? value : undefined;
}

function versionOf(headers: Headers): string | null {
  const value = headers.get(LIVE_VERSION_HEADER)?.trim() ?? "";
  return value === "" ? null : value;
}

function parseArgs(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) return undefined;
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") out[key] = entry;
  }
  return out;
}

function parseEntry(value: unknown, index: number): LiveEntry | null {
  if (!isRecord(value)) return null;
  const inferred =
    typeof value.tool === "string" || typeof value.label === "string" ? "tool" : "message";
  const type = asString(value.type) ?? inferred;
  const entry: LiveEntry = { type };
  const ts = asNullableNumber(value.ts);
  if (ts !== undefined) Object.assign(entry, { ts });
  const text = asString(value.text);
  if (text !== null) Object.assign(entry, { text });
  const phase = asNullableString(value.phase);
  if (phase !== undefined) Object.assign(entry, { phase });
  const live = asBoolean(value.live);
  if (typeof live === "boolean") Object.assign(entry, { live });
  const id = asString(value.id) ?? `${type}-${index}`;
  Object.assign(entry, { id });
  const tool = asString(value.tool);
  if (tool !== null) Object.assign(entry, { tool });
  const label = asString(value.label);
  if (label !== null) Object.assign(entry, { label });
  const args = parseArgs(value.args);
  if (args !== undefined) Object.assign(entry, { args });
  const status = asString(value.status);
  if (status !== null) Object.assign(entry, { status });
  if (value.output === null || typeof value.output === "string") {
    Object.assign(entry, { output: value.output });
  }
  const outputChars = asFiniteNumber(value.output_chars);
  if (outputChars !== null) Object.assign(entry, { output_chars: outputChars });
  const duration = asNullableNumber(value.duration_ms);
  if (duration !== undefined) Object.assign(entry, { duration_ms: duration });
  return entry;
}

function parseItem(value: unknown): LiveItemDetail | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const name = asString(value.name);
  const kind = asString(value.kind);
  const engine = asString(value.engine);
  const engineLabel = asString(value.engine_label);
  const model = asString(value.model);
  const status = asString(value.status);
  const toolCount = asFiniteNumber(value.tool_count);
  const messageCount = asFiniteNumber(value.message_count);
  const tokensIn = asFiniteNumber(value.tokens_in);
  const tokensOut = asFiniteNumber(value.tokens_out);
  if (
    id === null ||
    name === null ||
    kind === null ||
    engine === null ||
    engineLabel === null ||
    model === null ||
    status === null ||
    toolCount === null ||
    messageCount === null ||
    tokensIn === null ||
    tokensOut === null
  ) {
    return null;
  }
  const entriesRaw = Array.isArray(value.entries) ? value.entries : [];
  const item: LiveItemDetail = {
    id,
    name,
    kind,
    engine,
    engine_label: engineLabel,
    model,
    status,
    tool_count: toolCount,
    message_count: messageCount,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    entries: entriesRaw.flatMap((entry, index) => {
      const parsed = parseEntry(entry, index);
      return parsed === null ? [] : [parsed];
    }),
    prompt: "",
    final_text: asString(value.final_text) ?? "",
  };
  const started = asNullableNumber(value.started_ms);
  if (started !== undefined) Object.assign(item, { started_ms: started });
  const ended = asNullableNumber(value.ended_ms);
  if (ended !== undefined) Object.assign(item, { ended_ms: ended });
  const duration = asNullableNumber(value.duration_s);
  if (duration !== undefined) Object.assign(item, { duration_s: duration });
  const lastActivityMs = asNullableNumber(value.last_activity_ms);
  if (lastActivityMs !== undefined) Object.assign(item, { last_activity_ms: lastActivityMs });
  const lastActivity = asNullableString(value.last_activity);
  if (lastActivity !== undefined) Object.assign(item, { last_activity: lastActivity });
  const dropped = asFiniteNumber(value.dropped);
  if (dropped !== null) Object.assign(item, { dropped });
  const independent = asBoolean(value.independent);
  if (independent !== undefined) Object.assign(item, { independent });
  if (isRecord(value.result)) Object.assign(item, { result: value.result });
  return item;
}

function parseRunInfo(value: unknown): LiveRunInfo | null {
  if (!isRecord(value)) return null;
  const runId = sanitizeLiveConsoleRunId(asString(value.run_id));
  const status = asString(value.status);
  const engine = asString(value.engine);
  const engineLabel = asString(value.engine_label);
  const createdAt = asFiniteNumber(value.created_at);
  const serverNow = asFiniteNumber(value.server_now);
  if (runId === null || status === null || engine === null || engineLabel === null) return null;
  if (createdAt === null || serverNow === null) return null;
  const run: LiveRunInfo = {
    run_id: runId,
    status,
    engine,
    engine_label: engineLabel,
    created_at: createdAt,
    server_now: serverNow,
  };
  if (value.pr === null || (typeof value.pr === "number" && Number.isSafeInteger(value.pr))) {
    Object.assign(run, { pr: value.pr ?? null });
  }
  if (value.issue === null || (typeof value.issue === "number" && Number.isSafeInteger(value.issue))) {
    Object.assign(run, { issue: value.issue ?? null });
  }
  const strings = [
    "sha",
    "repo",
    "mode",
    "verdict",
    "review_url",
    "pr_url",
    "review_size",
    "prior_sha",
    "target_label",
    "kind",
    "branch",
    "opened_pr_url",
    "issue_title",
    "live_url",
  ] as const;
  for (const key of strings) {
    const parsed = asNullableString(value[key]);
    if (parsed !== undefined) Object.assign(run, { [key]: parsed });
  }
  const elapsed = asNullableNumber(value.elapsed_s);
  if (elapsed !== undefined) Object.assign(run, { elapsed_s: elapsed });
  const confidence = asNullableNumber(value.confidence_score);
  if (confidence !== undefined) Object.assign(run, { confidence_score: confidence });
  const modelOk = asBoolean(value.model_validation_ok);
  if (modelOk !== undefined) Object.assign(run, { model_validation_ok: modelOk });
  return run;
}

function parseDecisionItem(value: unknown): LiveDecisionItem | null {
  if (!isRecord(value)) return null;
  const text = asString(value.text);
  if (text === null) return null;
  if (value.tag === undefined) return { text };
  if (value.tag === null || value.tag === "downgraded" || value.tag === "approved") {
    return { text, tag: value.tag };
  }
  return { text };
}

function parseDecision(value: unknown): LiveDecision | null | undefined {
  if (value === null) return null;
  if (!isRecord(value)) return undefined;
  const must = Array.isArray(value.must)
    ? value.must.flatMap((item) => {
        const parsed = parseDecisionItem(item);
        return parsed === null ? [] : [parsed];
      })
    : [];
  const notes = Array.isArray(value.notes)
    ? value.notes.flatMap((item) => {
        const parsed = parseDecisionItem(item);
        return parsed === null ? [] : [parsed];
      })
    : [];
  const dismissed = Array.isArray(value.dismissed)
    ? value.dismissed.filter((item): item is string => typeof item === "string")
    : [];
  const reasons = Array.isArray(value.enforcement_reasons)
    ? value.enforcement_reasons.filter((item): item is string => typeof item === "string")
    : [];
  const decision: LiveDecision = {
    posted: typeof value.posted === "boolean" ? value.posted : false,
    must,
    notes,
    dismissed,
    degraded: typeof value.degraded === "boolean" ? value.degraded : false,
    enforcement_reasons: reasons,
  };
  const verdict = asNullableString(value.verdict);
  if (verdict !== undefined) Object.assign(decision, { verdict });
  const confidence = asNullableNumber(value.confidence_score);
  if (confidence !== undefined) Object.assign(decision, { confidence_score: confidence });
  const reviewUrl = asNullableString(value.review_url);
  if (reviewUrl !== undefined) Object.assign(decision, { review_url: reviewUrl });
  const summary = asNullableString(value.summary);
  if (summary !== undefined) Object.assign(decision, { summary });
  if (isRecord(value.reconcile)) Object.assign(decision, { reconcile: value.reconcile });
  const reconcileReason = asNullableString(value.reconcile_reason);
  if (reconcileReason !== undefined) Object.assign(decision, { reconcile_reason: reconcileReason });
  if (value.second_pass === null || isRecord(value.second_pass)) {
    Object.assign(decision, { second_pass: value.second_pass });
  }
  if (value.first_pass === null || isRecord(value.first_pass)) {
    Object.assign(decision, { first_pass: value.first_pass });
  }
  return decision;
}

function parseRelated(value: unknown): LiveRelatedRun | null {
  if (!isRecord(value)) return null;
  const runId = sanitizeLiveConsoleRunId(asString(value.run_id));
  if (runId === null) return null;
  const related: LiveRelatedRun = { run_id: runId };
  for (const key of ["mode", "status", "sha"] as const) {
    const parsed = asNullableString(value[key]);
    if (typeof parsed === "string") Object.assign(related, { [key]: parsed });
  }
  const created = asNullableNumber(value.created_at);
  if (typeof created === "number") Object.assign(related, { created_at: created });
  const verdict = asNullableString(value.verdict);
  if (verdict !== undefined) Object.assign(related, { verdict });
  const confidence = asNullableNumber(value.confidence_score);
  if (confidence !== undefined) Object.assign(related, { confidence_score: confidence });
  const engine = asNullableString(value.engine_label);
  if (engine !== undefined) Object.assign(related, { engine_label: engine });
  const duration = asNullableNumber(value.duration_s);
  if (duration !== undefined) Object.assign(related, { duration_s: duration });
  return related;
}

export function mergeSelectedItem(
  items: readonly LiveItemDetail[],
  selected: LiveItemDetail | null,
): LiveItemDetail[] {
  if (selected === null) return [...items];
  let found = false;
  const merged = items.map((item) => {
    if (item.id !== selected.id) return item;
    found = true;
    return selected;
  });
  return found ? merged : [selected, ...merged];
}

export function parseLiveRunEnvelope(value: unknown): Result<PublicLiveRun, Error> {
  if (!isRecord(value)) return err(new PermanentError("live run: expected an object"));
  const run = parseRunInfo(value.run);
  if (run === null) return err(new PermanentError("live run: malformed run"));
  if (!Array.isArray(value.items)) return err(new PermanentError("live run: missing items"));
  const items: LiveItemDetail[] = [];
  for (const row of value.items) {
    const parsed = parseItem(row);
    if (parsed === null) return err(new PermanentError("live run: malformed item"));
    items.push(parsed);
  }
  const selected = value.selected === null || value.selected === undefined ? null : parseItem(value.selected);
  if (value.selected !== null && value.selected !== undefined && selected === null) {
    return err(new PermanentError("live run: malformed selected"));
  }
  const decision = parseDecision(value.decision ?? null);
  if (decision === undefined) return err(new PermanentError("live run: malformed decision"));
  const verdictJson =
    value.verdict_json === null || value.verdict_json === undefined
      ? null
      : isRecord(value.verdict_json)
        ? (value.verdict_json as LiveVerdict)
        : undefined;
  if (verdictJson === undefined) return err(new PermanentError("live run: malformed verdict"));
  const relatedRaw = Array.isArray(value.related) ? value.related : [];
  const related = relatedRaw.flatMap((row) => {
    const parsed = parseRelated(row);
    return parsed === null ? [] : [parsed];
  });
  return ok({
    visibility: "public",
    decision,
    run,
    items: mergeSelectedItem(items, selected),
    verdict_json: verdictJson,
    related,
  });
}

function httpResult(status: number): LiveRunApiResult {
  if (status === 401) return { kind: "unauthorized" };
  if (status === 404) return { kind: "not-found" };
  const retryable = status >= 500 || status === 408 || status === 429;
  const error = retryable
    ? new TransientError(`live run: HTTP ${status}`)
    : new PermanentError(`live run: HTTP ${status}`);
  return { kind: "error", error, retryable };
}

export async function fetchLiveRunApi(options: FetchLiveRunApiOptions): Promise<LiveRunApiResult> {
  const runId = sanitizeLiveConsoleRunId(options.runId);
  if (runId === null) {
    return { kind: "invalid", error: new PermanentError("live run: invalid run id") };
  }
  const base = options.base ?? liveRunsApiBase();
  const url = liveRunApiUrl(base, runId, {
    item: options.itemId,
    version: options.version,
  });
  const fetchImpl = options.fetch ?? globalThis.fetch;
  const init: RequestInit = {
    method: "GET",
    credentials: "omit",
    cache: "no-store",
  };
  if (options.signal !== undefined) init.signal = options.signal;
  const fetched = await tryCatchAsync(() => fetchImpl(url, init));
  if (!fetched.ok) {
    if (options.signal?.aborted) return { kind: "aborted" };
    return {
      kind: "error",
      error: new TransientError("live run: request failed", { cause: fetched.error }),
      retryable: true,
    };
  }
  const response = fetched.value;
  const version = versionOf(response.headers);
  if (response.status === 204) return { kind: "not-modified", version };
  if (response.status !== 200) return httpResult(response.status);
  const body = await tryCatchAsync(() => response.text());
  if (!body.ok) {
    return {
      kind: "error",
      error: new TransientError("live run: body failed", { cause: body.error }),
      retryable: true,
    };
  }
  if (body.value.trim() === "") {
    return { kind: "invalid", error: new PermanentError("live run: empty body") };
  }
  const parsed = tryCatch(() => JSON.parse(body.value) as unknown);
  if (!parsed.ok) {
    return { kind: "invalid", error: new PermanentError("live run: malformed JSON", { cause: parsed.error }) };
  }
  const envelope = parseLiveRunEnvelope(parsed.value);
  if (!envelope.ok) return { kind: "invalid", error: envelope.error };
  return { kind: "ok", version, live: envelope.value };
}

export function subscribeLiveRun(options: {
  runId: string;
  itemId?: string | null | undefined;
  intervalMs: number;
  base?: string | undefined;
  fetch?: typeof globalThis.fetch | undefined;
  onResult: (result: LiveRunApiResult) => void;
}): () => void {
  let version: string | null = null;
  const source = pollingSource<LiveRunApiResult>({
    intervalMs: options.intervalMs,
    isEqual: isUnchangedLiveRunResult,
    onError: (error) => {
      options.onResult({ kind: "error", error, retryable: true });
    },
    poll: async (signal) => {
      const request: FetchLiveRunApiOptions = {
        runId: options.runId,
        version,
        signal,
      };
      if (options.itemId !== undefined) request.itemId = options.itemId;
      if (options.base !== undefined) request.base = options.base;
      if (options.fetch !== undefined) request.fetch = options.fetch;
      const result = await fetchLiveRunApi(request);
      if (result.kind === "ok" || result.kind === "not-modified") {
        version = result.version ?? version;
      }
      if (result.kind === "error" && result.retryable) {
        throw result.error;
      }
      return result;
    },
  });
  let stop = () => {};
  stop = source.subscribe((result) => {
    if (result.kind === "aborted") return;
    options.onResult(result);
    if (result.kind === "ok" && !isLiveRunActive(result.live.run.status)) stop();
    if (
      result.kind === "unauthorized" ||
      result.kind === "not-found" ||
      result.kind === "invalid" ||
      (result.kind === "error" && !result.retryable)
    ) {
      stop();
    }
  });
  return stop;
}
