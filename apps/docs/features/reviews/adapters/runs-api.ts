import { err, ok, PermanentError, type Result } from "@zedtech/zedkit-core";
import { fetchJson, type FetchJsonOptions } from "@zedtech/zedkit-live";

import type { RunsApiRun } from "../model/merge-public-index.ts";
import { RUN_ID_PATTERN, sanitizeLiveUrl } from "../model/public-review.ts";
import type {
  ReviewVerdict,
  TimelineEntryStatus,
  TimelineEntryType,
} from "../ports/review-port";

export type { RunsApiRun } from "../model/merge-public-index.ts";

export type RunsFetchOptions = {
  fetch?: typeof globalThis.fetch;
  sleep?: (ms: number) => Promise<void>;
  retries?: number;
  timeoutMs?: number;
  runsBase: string;
};

const PAGE_CAP = 10;
const LIMIT = 200;
const ENTRY_TYPES = new Set<TimelineEntryType>([
  "plan",
  "implement",
  "review",
  "improve",
  "dry-run",
]);
const ENTRY_STATUSES = new Set<TimelineEntryStatus>(["running", "completed", "failed"]);
const VERDICTS = new Set<ReviewVerdict>(["approve", "request-changes", "comment"]);

export function liveServiceName(): string {
  return "zedos-bot";
}

export function runsApiBaseEnvName(): string {
  return "NEXT_PUBLIC_ZEDOS_RUNS_API_BASE";
}

export function runsListUrl(base: string, cursor: string | null): string {
  const root = `${base.replace(/\/$/, "")}/${liveServiceName()}/api/runs`;
  const params = new URLSearchParams({ limit: String(LIMIT) });
  if (cursor !== null && cursor !== "") params.set("cursor", cursor);
  return `${root}?${params}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asSafeInt(value: unknown): number | null | undefined {
  if (value === undefined) return null;
  if (value === null) return null;
  if (typeof value === "number" && Number.isSafeInteger(value)) return value;
  return undefined;
}

function asIso(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  if (!Number.isFinite(Date.parse(value))) return null;
  return value;
}

function asKind(value: unknown): TimelineEntryType | null {
  if (typeof value !== "string") return null;
  return ENTRY_TYPES.has(value as TimelineEntryType) ? (value as TimelineEntryType) : null;
}

function asStatus(value: unknown): TimelineEntryStatus | null {
  if (typeof value !== "string") return null;
  return ENTRY_STATUSES.has(value as TimelineEntryStatus)
    ? (value as TimelineEntryStatus)
    : null;
}

function asVerdict(value: unknown): ReviewVerdict | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return undefined;
  return VERDICTS.has(value as ReviewVerdict) ? (value as ReviewVerdict) : undefined;
}

function asScore(value: unknown): number | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 10) {
    return undefined;
  }
  return value;
}

function asModels(value: unknown): string[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") return null;
    if (item !== "") out.push(item);
  }
  return out;
}

function asDuration(value: unknown): number | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) return undefined;
  return value;
}

export function parseRunsEnvelope(
  value: unknown,
): Result<{ nextCursor: string | null; runs: RunsApiRun[] }, Error> {
  if (!isRecord(value)) return err(new PermanentError("runs: expected an object"));
  if (value.version !== 1) return err(new PermanentError("runs: unknown version"));
  if (!Array.isArray(value.runs)) return err(new PermanentError("runs: missing runs"));
  const nextCursor = value.nextCursor === undefined || value.nextCursor === null ? null : value.nextCursor;
  if (nextCursor !== null && (typeof nextCursor !== "string" || nextCursor === "")) {
    return err(new PermanentError("runs: invalid nextCursor"));
  }
  const runs: RunsApiRun[] = [];
  for (const row of value.runs) {
    const parsed = parseRun(row);
    if (parsed === null) return err(new PermanentError("runs: malformed run"));
    runs.push(parsed);
  }
  return ok({ nextCursor, runs });
}

function parseRun(value: unknown): RunsApiRun | null {
  if (!isRecord(value)) return null;
  if (typeof value.runId !== "string" || !RUN_ID_PATTERN.test(value.runId)) return null;
  const issue = asSafeInt(value.issue);
  const pr = asSafeInt(value.pr);
  const kind = asKind(value.kind);
  const status = asStatus(value.status);
  const startedAt = asIso(value.startedAt);
  const endedAt =
    value.endedAt === undefined || value.endedAt === null ? null : asIso(value.endedAt);
  if (value.endedAt !== undefined && value.endedAt !== null && endedAt === null) return null;
  const durationMs = asDuration(value.durationMs);
  const models = asModels(value.models);
  const verdict = asVerdict(value.verdict);
  const score = asScore(value.score);
  if (issue === undefined || pr === undefined || kind === null || status === null) return null;
  if (startedAt === null || durationMs === undefined || models === null) return null;
  if (verdict === undefined || score === undefined) return null;
  if (typeof value.superseded !== "boolean") return null;
  const phase = value.phase === undefined || value.phase === null ? null : value.phase;
  if (phase !== null && typeof phase !== "string") return null;
  const liveUrl =
    value.liveUrl === undefined || value.liveUrl === null
      ? null
      : typeof value.liveUrl === "string"
        ? sanitizeLiveUrl(value.liveUrl)
        : undefined;
  if (liveUrl === undefined) return null;
  return {
    runId: value.runId,
    issue,
    pr,
    kind,
    phase,
    status,
    startedAt,
    endedAt,
    durationMs,
    models,
    verdict,
    score,
    superseded: value.superseded,
    liveUrl,
  };
}

function request(options: RunsFetchOptions): FetchJsonOptions {
  return {
    ...(options.fetch === undefined ? {} : { fetch: options.fetch }),
    ...(options.sleep === undefined ? {} : { sleep: options.sleep }),
    ...(options.retries === undefined ? {} : { retries: options.retries }),
    ...(options.timeoutMs === undefined ? {} : { timeoutMs: options.timeoutMs }),
  };
}

/**
 * GET pages of the hosted runs list. Caps at `PAGE_CAP` × `LIMIT` (2000).
 * A leftover `nextCursor` is dropped and the Result stays ok (partial list;
 * same contract as DATA-SOURCES.md Caps).
 */
export async function fetchRunsIndex(
  options: RunsFetchOptions,
): Promise<Result<RunsApiRun[], Error>> {
  const collected: RunsApiRun[] = [];
  let cursor: string | null = null;
  const init = request(options);
  for (let page = 0; page < PAGE_CAP; page += 1) {
    const result = await fetchJson(runsListUrl(options.runsBase, cursor), init);
    if (!result.ok) return result;
    const parsed = parseRunsEnvelope(result.value);
    if (!parsed.ok) return parsed;
    collected.push(...parsed.value.runs);
    if (parsed.value.nextCursor === null) return ok(collected);
    cursor = parsed.value.nextCursor;
  }
  return ok(collected);
}
