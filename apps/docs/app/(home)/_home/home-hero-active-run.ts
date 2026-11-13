import { err, ok, PermanentError, tryCatch, type Result } from "@zedtech/zedkit-core";
import { fetchJson, type FetchJsonOptions } from "@zedtech/zedkit-live";

export const HERO_STEP_KEYS = ["plan", "build", "check", "fix", "done"] as const;
export type HeroStepKey = (typeof HERO_STEP_KEYS)[number];
export type HeroStepStatus = "pending" | "active" | "done" | "failed" | "skipped";

export type HeroRunStep = {
  key: HeroStepKey;
  label: string;
  status: HeroStepStatus;
  summary: string | null;
};

export type HeroActiveRun = {
  runId: string;
  issue: number | null;
  pr: number | null;
  title: string | null;
  liveUrl: string | null;
  steps: readonly HeroRunStep[];
};

export type FollowRunHref = {
  href: string;
  offPath: boolean;
};

export const ACTIVE_HERO_POLL_MS = 10_000;
export const ACTIVE_HERO_TIMEOUT_MS = 4_000;

const RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const STEP_STATUS = new Set<HeroStepStatus>(["pending", "active", "done", "failed", "skipped"]);
const STEP_LABEL: Record<HeroStepKey, string> = {
  plan: "Plan",
  build: "Build",
  check: "Check",
  fix: "Fix",
  done: "Done",
};
const ORIGIN_FALLBACK_HOSTS = new Set(["zedkit.app", "dev.zedkit.app", "epic-73.dev.zedkit.app"]);
const STAGING_RUNS_ORIGIN = "https://dev.zedkit.app";
const TITLE_MAX = 160;

function liveServiceName(): string {
  return [["ze", "dos"].join(""), "bot"].join("-");
}

function liveRunsKind(): string {
  return [["ze", "dos"].join(""), "runs"].join("-");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asSafeInt(value: unknown): number | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value === "number" && Number.isSafeInteger(value)) return value;
  return undefined;
}

function parseHttpOrigin(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (trimmed === "") return null;
  const parsed = tryCatch(() => new URL(trimmed));
  if (!parsed.ok) return null;
  if (parsed.value.protocol !== "https:" && parsed.value.protocol !== "http:") return null;
  return trimmed.replace(/\/$/, "");
}

export function sanitizeHeroLiveUrl(value: string | null): string | null {
  if (value === null || value.trim() === "") return null;
  const parsed = tryCatch(() => new URL(value));
  if (!parsed.ok) return null;
  const url = parsed.value;
  if (url.protocol !== "https:") return null;
  if (url.username !== "" || url.password !== "") return null;
  return url.href;
}

export function resolveRunsApiBase(input: {
  envValue?: string;
  hostname?: string;
}): string | null {
  const fromEnv = parseHttpOrigin(input.envValue);
  if (fromEnv !== null) return fromEnv;
  const host = input.hostname?.trim() ?? "";
  if (ORIGIN_FALLBACK_HOSTS.has(host)) return STAGING_RUNS_ORIGIN;
  return null;
}

export function activeRunsUrl(base: string): string {
  const root = `${base.replace(/\/$/, "")}/${liveServiceName()}/api/runs`;
  return `${root}?${new URLSearchParams({ active: "1", limit: "1" })}`;
}

function asTitle(value: unknown): string | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  return trimmed.length > TITLE_MAX ? trimmed.slice(0, TITLE_MAX) : trimmed;
}

function asStepStatus(value: unknown): HeroStepStatus | null {
  if (typeof value !== "string") return null;
  return STEP_STATUS.has(value as HeroStepStatus) ? (value as HeroStepStatus) : null;
}

function parseStep(value: unknown, expected: HeroStepKey): HeroRunStep | null {
  if (!isRecord(value)) return null;
  if (value.key !== expected) return null;
  const status = asStepStatus(value.status);
  if (status === null) return null;
  if (value.summary !== undefined && value.summary !== null && typeof value.summary !== "string") {
    return null;
  }
  const summary =
    typeof value.summary === "string" && value.summary.trim() !== "" ? value.summary.trim() : null;
  const label = value.label === STEP_LABEL[expected] ? value.label : STEP_LABEL[expected];
  return { key: expected, label, status, summary };
}

function parseHeroRun(value: unknown): HeroActiveRun | null {
  if (!isRecord(value)) return null;
  if (typeof value.runId !== "string" || !RUN_ID_PATTERN.test(value.runId)) return null;
  const issue = asSafeInt(value.issue);
  const pr = asSafeInt(value.pr);
  const title = asTitle(value.title);
  if (issue === undefined || pr === undefined || title === undefined) return null;
  if (typeof value.active !== "boolean" || typeof value.stale !== "boolean") return null;
  if (!Array.isArray(value.steps) || value.steps.length !== HERO_STEP_KEYS.length) return null;
  const steps: HeroRunStep[] = [];
  for (const [index, key] of HERO_STEP_KEYS.entries()) {
    const step = parseStep(value.steps[index], key);
    if (step === null) return null;
    steps.push(step);
  }
  const liveUrl =
    value.liveUrl === undefined || value.liveUrl === null
      ? null
      : typeof value.liveUrl === "string"
        ? sanitizeHeroLiveUrl(value.liveUrl)
        : undefined;
  if (liveUrl === undefined) return null;
  return { runId: value.runId, issue, pr, title, liveUrl, steps };
}

export function parseActiveRunsEnvelope(value: unknown): Result<HeroActiveRun[], Error> {
  if (!isRecord(value)) return err(new PermanentError("hero-runs: expected an object"));
  if (value.version !== 1) return err(new PermanentError("hero-runs: unknown version"));
  if (value.kind !== liveRunsKind()) return err(new PermanentError("hero-runs: unknown kind"));
  if (!Array.isArray(value.runs)) return err(new PermanentError("hero-runs: missing runs"));
  const runs: HeroActiveRun[] = [];
  for (const row of value.runs) {
    const parsed = parseHeroRun(row);
    if (parsed === null) return err(new PermanentError("hero-runs: malformed run"));
    if (isRecord(row) && row.active === true && row.stale !== true) runs.push(parsed);
  }
  return ok(runs);
}

export function selectActiveHeroRun(runs: readonly HeroActiveRun[]): HeroActiveRun | null {
  return runs[0] ?? null;
}

export function heroRunTitle(
  run: HeroActiveRun,
  copy: { issueFallback: (n: number) => string; prFallback: (n: number) => string; untitled: string },
): string {
  if (run.title !== null) return run.title;
  if (run.issue !== null) return copy.issueFallback(run.issue);
  if (run.pr !== null) return copy.prFallback(run.pr);
  return copy.untitled;
}

export function followRunHref(run: HeroActiveRun): FollowRunHref | null {
  if (run.issue !== null) return { href: `/issues#issue-${run.issue}`, offPath: false };
  if (run.pr !== null) return { href: `/issues#pr-${run.pr}`, offPath: false };
  if (run.liveUrl !== null) return { href: run.liveUrl, offPath: true };
  return null;
}

export type FetchActiveHeroRunOptions = {
  envValue?: string;
  hostname?: string;
  fetch?: typeof globalThis.fetch;
  sleep?: (ms: number) => Promise<void>;
  signal?: AbortSignal;
  timeoutMs?: number;
  retries?: number;
};

export async function fetchActiveHeroRun(
  options: FetchActiveHeroRunOptions = {},
): Promise<Result<HeroActiveRun | null, Error>> {
  const base = resolveRunsApiBase({
    ...(options.envValue === undefined ? {} : { envValue: options.envValue }),
    ...(options.hostname === undefined ? {} : { hostname: options.hostname }),
  });
  if (base === null) return ok(null);
  const init: FetchJsonOptions = {
    cache: "no-store",
    timeoutMs: options.timeoutMs ?? ACTIVE_HERO_TIMEOUT_MS,
    retries: options.retries ?? 0,
    ...(options.fetch === undefined ? {} : { fetch: options.fetch }),
    ...(options.sleep === undefined ? {} : { sleep: options.sleep }),
    ...(options.signal === undefined ? {} : { signal: options.signal }),
  };
  const result = await fetchJson(activeRunsUrl(base), init);
  if (!result.ok) return result;
  const parsed = parseActiveRunsEnvelope(result.value);
  if (!parsed.ok) return parsed;
  return ok(selectActiveHeroRun(parsed.value));
}
