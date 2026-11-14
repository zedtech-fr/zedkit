import { tryCatch } from "@zedtech/zedkit-core";

import { formatDuration } from "../feedback/format-duration.js";
import type { StatusDotTone } from "../feedback/status-dot.js";
import type { ZedkitUiMessages } from "../messages.js";

export type AgentConsoleFindingDisposition = "kept" | "downgraded" | "dismissed";

export type AgentConsoleDecision = {
  verdict: string | null;
  /** Already a /10 score; do not multiply. */
  confidence: number | null;
  posted: boolean;
  postedReviewHref: string | null;
  summary: string | null;
  mustChange: readonly { text: string }[];
  notes: readonly { text: string; tag?: "downgraded" | "approved" | null }[];
  dismissed: readonly string[];
  firstPass: {
    verdict: string | null;
    confidence: number | null;
    findings: readonly { id: string; text: string; disposition: AgentConsoleFindingDisposition }[];
  } | null;
  secondPass: { model: string | null; blocksMerge: boolean | null; summary: string | null } | null;
};

export type AgentConsoleEntry =
  | { id: string; kind: "tool"; name: string; body?: string; status?: string; durationMs?: number | null }
  | { id: string; kind: "message"; text: string }
  | { id: string; kind: "reasoning"; text: string; live?: boolean };

export type AgentConsoleItem = {
  id: string;
  name: string;
  /** main | lens | second_pass | workflow | helper | subagent | observer | gate | other */
  kind: string;
  status: string;
  model: string;
  /** Engine badge in the item header; falls back to model. */
  engineLabel?: string | null;
  durationMs: number | null;
  toolCount: number;
  startedAt: number | null;
  lastActivityAt: number | null;
  tokensIn: number;
  tokensOut: number;
  running: boolean;
  streamLabel?: string | null;
  entries: readonly AgentConsoleEntry[];
};

export type AgentConsoleRun = {
  pr: number | null;
  sha: string | null;
  engineLabel: string;
  durationMs: number | null;
  reviewSize: string | null;
  verdict: string | null;
  /** Already a /10 score; do not multiply. */
  confidence: number | null;
  postedReviewHref: string | null;
  /** True while the run is still live; shows a pulse in the sidebar header. */
  running?: boolean;
};

export type AgentConsoleProps = {
  run: AgentConsoleRun;
  items: readonly AgentConsoleItem[];
  decision?: AgentConsoleDecision | null;
  selectedId?: string;
  defaultSelectedId?: string;
  onSelectedIdChange?: (id: string) => void;
  className?: string;
  /** Heading level for the selected item name. Standalone pages pass 1; embeds keep 2. */
  headingLevel?: 1 | 2;
};

export type AgentConsoleGroup = {
  kind: string;
  items: AgentConsoleItem[];
};

export type AgentConsoleCopy = ZedkitUiMessages["agentConsole"];

export const MISSING = "–";

const KIND_ORDER = ["main", "lens", "second_pass", "workflow", "helper", "observer"] as const;
const SHA_SHORT = 7;
const HTTP_PROTOCOL = /^https?:$/i;

/** Live kinds that share a sidebar bucket: helpers run as `subagent`, gates sit with the lenses. */
const KIND_ALIAS: Record<string, (typeof KIND_ORDER)[number]> = {
  subagent: "helper",
  gate: "lens",
};

const GROUP_LABEL: Record<(typeof KIND_ORDER)[number], keyof AgentConsoleCopy> = {
  main: "groupMain",
  lens: "groupLens",
  second_pass: "groupSecondPass",
  workflow: "groupWorkflow",
  helper: "groupHelper",
  observer: "groupObserver",
};

export function groupConsoleItems(items: readonly AgentConsoleItem[]): AgentConsoleGroup[] {
  const buckets = new Map<string, AgentConsoleItem[]>();
  for (const item of items) {
    const bucket = KIND_ALIAS[item.kind] ?? item.kind;
    const list = buckets.get(bucket);
    if (list) list.push(item);
    else buckets.set(bucket, [item]);
  }
  const groups: AgentConsoleGroup[] = [];
  for (const kind of KIND_ORDER) {
    const list = buckets.get(kind);
    if (!list) continue;
    groups.push({ kind, items: list });
    buckets.delete(kind);
  }
  for (const [kind, list] of buckets) {
    groups.push({ kind, items: list });
  }
  return groups;
}

export function defaultConsoleSelectedId(
  items: readonly AgentConsoleItem[],
  defaultSelectedId?: string,
): string | undefined {
  if (defaultSelectedId && items.some((item) => item.id === defaultSelectedId)) return defaultSelectedId;
  return items.find((item) => item.kind === "main")?.id ?? items[0]?.id;
}

export function groupLabel(kind: string, copy: AgentConsoleCopy): string {
  const bucket = KIND_ALIAS[kind] ?? kind;
  const key = GROUP_LABEL[bucket as keyof typeof GROUP_LABEL];
  return key ? copy[key] : kind;
}

export function durationText(ms: number | null, locale: string): string {
  return ms == null ? MISSING : formatDuration(ms, locale);
}

/** Host-supplied href for a posted review. Only `http:` / `https:` render. */
export function httpHref(value: string | null | undefined): string | undefined {
  if (value == null) return undefined;
  const href = value.trim();
  const parsed = tryCatch(() => new URL(href));
  if (!parsed.ok || !HTTP_PROTOCOL.test(parsed.value.protocol)) return undefined;
  return href;
}

export function shortSha(sha: string): string {
  return sha.length > SHA_SHORT ? sha.slice(0, SHA_SHORT) : sha;
}

export function formatStarted(startedAt: number | null, locale: string): string {
  if (startedAt == null) return MISSING;
  // Chromium may insert NBSP in medium dates; pin UTC so SSR hydrate does not #418.
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  })
    .format(new Date(startedAt))
    .replace(/[\u00A0\u202F]/g, " ");
}

export function dispositionLabel(
  disposition: AgentConsoleFindingDisposition,
  copy: AgentConsoleCopy,
): string {
  if (disposition === "kept") return copy.kept;
  if (disposition === "downgraded") return copy.downgraded;
  return copy.dismissed;
}

/** Live statuses arrive lowercase (`done`); badges read capitalized (`Done`). */
export function statusLabel(status: string): string {
  const trimmed = status.trim();
  if (trimmed === "") return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/** Dot tone for a console status: live pulses, done succeeds, failures warn. */
export function statusTone(status: string, running: boolean): StatusDotTone {
  if (running) return "active";
  switch (status.trim().toLowerCase()) {
    case "running":
    case "starting":
      return "active";
    case "done":
    case "completed":
    case "ran":
      return "success";
    case "error":
    case "failed":
      return "danger";
    case "aborted":
    case "superseded":
    case "interrupted":
      return "warning";
    default:
      return "idle";
  }
}

/** Live verdicts read uppercase with words split (`REQUEST CHANGES`). */
export function verdictLabel(verdict: string | null): string | null {
  if (verdict === null) return null;
  const trimmed = verdict.trim();
  if (trimmed === "") return null;
  return trimmed.toUpperCase().replaceAll("_", " ");
}

/** Compact token counts (`868k`, `20.2k`, `1M`); bad values clamp to `0`. */
export function compactTokenCount(value: number, locale: string): string {
  if (!Number.isFinite(value) || value < 0) return "0";
  if (value >= 1_000_000) {
    const scaled = value / 1_000_000;
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: value >= 10_000_000 ? 0 : 1 }).format(scaled)}M`;
  }
  if (value >= 1000) {
    const digits = value >= 100_000 ? 0 : 1;
    const scaled = value / 1000;
    if (Number(scaled.toFixed(digits)) >= 1000) {
      return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value / 1_000_000)}M`;
    }
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(scaled)}k`;
  }
  return new Intl.NumberFormat(locale, { useGrouping: false }).format(value);
}
