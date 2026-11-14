import { err, ok, PermanentError, tryCatch, type Result } from "@zedtech/zedkit-core";
import { fetchJson, type FetchJsonOptions } from "@zedtech/zedkit-live";

export const HERO_STEP_KEYS = ["plan", "build", "check", "fix", "done"] as const;
export type HeroStepKey = (typeof HERO_STEP_KEYS)[number];
export type HeroStepStatus = "pending" | "active" | "done" | "failed" | "skipped";

export type HeroRunStep = {
  key: HeroStepKey;
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
const HERO_STEP_KEY_SET: ReadonlySet<string> = new Set(HERO_STEP_KEYS);
/** Product decision: public hosts without env fetch the staging runs origin (prod and epic-73 included until that host expires). */
const ORIGIN_FALLBACK_HOSTS = new Set(["zedkit.app", "dev.zedkit.app", "epic-73.dev.zedkit.app"]);
const STAGING_RUNS_ORIGIN = "https://dev.zedkit.app";
const TITLE_MAX = 160;
const SUMMARY_MAX = 160;

function liveServiceName(): string {
  return "zedos-bot";
}

/** Same allowlist as reviews `sanitizeLiveUrl` (host + `/live/` + run id). */
function hostedLiveHrefPrefix(): string {
  return `${STAGING_RUNS_ORIGIN}/${liveServiceName()}/live/`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Hero issue/PR numbers are GitHub ids: positive safe integers. Reviews `asSafeInt` accepts any safe int. */
function asSafeInt(value: unknown): number | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) return value;
  return undefined;
}

function parseHttpsOrigin(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (trimmed === "") return null;
  const parsed = tryCatch(() => new URL(trimmed));
  if (!parsed.ok) return null;
  const url = parsed.value;
  if (url.protocol !== "https:") return null;
  if (url.username !== "" || url.password !== "") return null;
  if (url.port !== "") return null;
  return url.origin;
}

export function sanitizeHeroLiveUrl(value: string | null): string | null {
  if (value === null || value.trim() === "") return null;
  const parsed = tryCatch(() => new URL(value));
  if (!parsed.ok) return null;
  const url = parsed.value;
  const prefix = hostedLiveHrefPrefix();
  const prefixUrl = new URL(prefix);
  if (url.protocol !== "https:") return null;
  if (url.username !== "" || url.password !== "") return null;
  if (url.port !== "") return null;
  if (url.search !== "" || url.hash !== "") return null;
  if (url.hostname.toLowerCase() !== prefixUrl.hostname.toLowerCase()) return null;
  if (!url.pathname.startsWith(prefixUrl.pathname)) return null;
  const rest = url.pathname.slice(prefixUrl.pathname.length);
  const runId = rest.endsWith("/") ? rest.slice(0, -1) : rest;
  if (runId.includes("/") || !RUN_ID_PATTERN.test(runId)) return null;
  return `${prefix}${runId}`;
}

export function resolveRunsApiBase(input: {
  envValue?: string;
  hostname?: string;
}): string | null {
  const fromEnv = parseHttpsOrigin(input.envValue);
  if (fromEnv !== null) return fromEnv;
  const host = (input.hostname?.trim() ?? "").toLowerCase();
  if (ORIGIN_FALLBACK_HOSTS.has(host)) return STAGING_RUNS_ORIGIN;
  return null;
}

export function activeRunsUrl(base: string): string {
  const root = `${base.replace(/\/$/, "")}/${liveServiceName()}/api/runs`;
  return `${root}?${new URLSearchParams({ active: "1", limit: "1" })}`;
}

export function nextLivePollMs(paused: boolean, base: string | null): number | null {
  if (paused || base === null) return null;
  return ACTIVE_HERO_POLL_MS;
}

function asClippedText(value: unknown, max: number): string | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const chars = [...trimmed];
  return chars.length > max ? chars.slice(0, max).join("") : trimmed;
}

function asStepStatus(value: unknown): HeroStepStatus | null {
  if (typeof value !== "string") return null;
  return STEP_STATUS.has(value as HeroStepStatus) ? (value as HeroStepStatus) : null;
}

function parseStep(value: Record<string, unknown>, expected: HeroStepKey): HeroRunStep | null {
  if (value.key !== expected) return null;
  const status = asStepStatus(value.status);
  if (status === null) return null;
  const summary = asClippedText(value.summary, SUMMARY_MAX);
  if (summary === undefined) return null;
  return { key: expected, status, summary };
}

function parseSteps(value: unknown): HeroRunStep[] | null {
  if (!Array.isArray(value) || value.length > 32) return null;
  const byKey = new Map<HeroStepKey, HeroRunStep>();
  for (const item of value) {
    if (!isRecord(item)) return null;
    if (!HERO_STEP_KEY_SET.has(item.key as string)) continue;
    const key = item.key as HeroStepKey;
    if (byKey.has(key)) return null;
    const step = parseStep(item, key);
    if (step === null) return null;
    byKey.set(key, step);
  }
  const steps: HeroRunStep[] = [];
  for (const key of HERO_STEP_KEYS) {
    const step = byKey.get(key);
    if (step === undefined) return null;
    steps.push(step);
  }
  return steps;
}

export function parseHeroRun(value: unknown): HeroActiveRun | null {
  if (!isRecord(value)) return null;
  if (typeof value.runId !== "string" || !RUN_ID_PATTERN.test(value.runId)) return null;
  const issue = asSafeInt(value.issue);
  const pr = asSafeInt(value.pr);
  const title = asClippedText(value.title, TITLE_MAX);
  if (issue === undefined || pr === undefined || title === undefined) return null;
  if (typeof value.active !== "boolean" || typeof value.stale !== "boolean") return null;
  if (value.active !== true || value.stale === true) return null;
  const steps = parseSteps(value.steps);
  if (steps === null) return null;
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
  if (!Array.isArray(value.runs)) return err(new PermanentError("hero-runs: missing runs"));
  const first = value.runs[0];
  if (first === undefined) return ok([]);
  if (!isRecord(first)) return err(new PermanentError("hero-runs: malformed run"));
  if (first.active !== true || first.stale === true) return ok([]);
  const parsed = parseHeroRun(first);
  if (parsed === null) return err(new PermanentError("hero-runs: malformed run"));
  return ok([parsed]);
}

export function selectActiveHeroRun(runs: readonly HeroActiveRun[]): HeroActiveRun | null {
  return runs[0] ?? null;
}

export type HeroStepCopy = {
  stepPlan: string;
  stepBuild: string;
  stepCheck: string;
  stepFix: string;
  stepDone: string;
};

export function heroStepLabel(key: HeroStepKey, copy: HeroStepCopy): string {
  switch (key) {
    case "plan":
      return copy.stepPlan;
    case "build":
      return copy.stepBuild;
    case "check":
      return copy.stepCheck;
    case "fix":
      return copy.stepFix;
    case "done":
      return copy.stepDone;
  }
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
  if (run.liveUrl === null) return null;
  const href = sanitizeHeroLiveUrl(run.liveUrl);
  if (href === null) return null;
  return { href, offPath: true };
}

export type HeroLiveCopy = HeroStepCopy & {
  issueFallback: (n: number) => string;
  prFallback: (n: number) => string;
  untitled: string;
  liveStatus: (title: string, step: string) => string;
  liveStatusPaused: (title: string) => string;
  liveStatusFailed: (title: string, step: string) => string;
  liveStatusStale: (title: string) => string;
};

export function liveUpdateMessage(
  run: HeroActiveRun,
  copy: HeroLiveCopy,
  paused = false,
  stale = false,
): string {
  const title = heroRunTitle(run, copy);
  if (stale) return copy.liveStatusStale(title);
  const failed = run.steps.find((step) => step.status === "failed");
  if (failed !== undefined) return copy.liveStatusFailed(title, heroStepLabel(failed.key, copy));
  if (paused) return copy.liveStatusPaused(title);
  const active = run.steps.find((step) => step.status === "active");
  return copy.liveStatus(title, active === undefined ? "" : heroStepLabel(active.key, copy));
}

export type HeroLivePollTimer = ReturnType<typeof setTimeout>;

export type HeroLivePollOptions = {
  delayMs: number;
  poll: (signal: AbortSignal) => Promise<Result<HeroActiveRun | null, Error>>;
  setLive: (run: HeroActiveRun | null) => void;
  onError?: () => void;
  isHidden?: () => boolean;
  setTimeoutFn?: (fn: () => void, ms: number) => HeroLivePollTimer;
  clearTimeoutFn?: (id: HeroLivePollTimer) => void;
};

const LIVE_POLL_BACKOFF_CAP = 8;

/** Immediate tick, then re-arm after settle (empty, success, or error). Abort skips setLive. Hidden tabs skip the fetch. Consecutive errors back off. */
export function startHeroLivePoll(options: HeroLivePollOptions): () => void {
  const setTimeoutFn = options.setTimeoutFn ?? ((fn, ms) => setTimeout(fn, ms));
  const clearTimeoutFn = options.clearTimeoutFn ?? ((id) => clearTimeout(id));
  const controller = new AbortController();
  let timer: HeroLivePollTimer | undefined;
  let cancelled = false;
  let consecutiveErrors = 0;

  const schedule = () => {
    if (cancelled || controller.signal.aborted) return;
    const factor = consecutiveErrors === 0 ? 1 : Math.min(LIVE_POLL_BACKOFF_CAP, 2 ** consecutiveErrors);
    timer = setTimeoutFn(tick, options.delayMs * factor);
  };

  const tick = () => {
    if (cancelled || controller.signal.aborted) return;
    if (options.isHidden?.() === true) {
      schedule();
      return;
    }
    void options
      .poll(controller.signal)
      .then((result) => {
        if (cancelled || controller.signal.aborted) return;
        if (result.ok) {
          consecutiveErrors = 0;
          options.setLive(result.value);
        } else {
          consecutiveErrors += 1;
          options.onError?.();
        }
      })
      .catch(() => {
        if (cancelled || controller.signal.aborted) return;
        consecutiveErrors += 1;
        options.onError?.();
      })
      .then(schedule, schedule);
  };

  tick();
  return () => {
    cancelled = true;
    controller.abort();
    if (timer !== undefined) clearTimeoutFn(timer);
  };
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
  const timeoutMs = options.timeoutMs ?? ACTIVE_HERO_TIMEOUT_MS;
  const retries = options.retries ?? 0;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 60_000) {
    return err(new PermanentError("hero-runs: invalid timeout"));
  }
  if (!Number.isInteger(retries) || retries < 0 || retries > 5) {
    return err(new PermanentError("hero-runs: invalid retries"));
  }
  const init: FetchJsonOptions = {
    cache: "no-store",
    timeoutMs,
    retries,
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
