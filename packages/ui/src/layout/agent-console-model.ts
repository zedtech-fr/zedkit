import { tryCatch } from "@zedtech/zedkit-core";

import { formatDuration } from "../feedback/format-duration.js";
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
  /** main | lens | second_pass | workflow | helper | observer | gate | other */
  kind: string;
  status: string;
  model: string;
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
};

export type AgentConsoleProps = {
  run: AgentConsoleRun;
  items: readonly AgentConsoleItem[];
  decision?: AgentConsoleDecision | null;
  selectedId?: string;
  defaultSelectedId?: string;
  onSelectedIdChange?: (id: string) => void;
  className?: string;
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

const GROUP_LABEL: Record<(typeof KIND_ORDER)[number] | "gate", keyof AgentConsoleCopy> = {
  main: "groupMain",
  lens: "groupLens",
  second_pass: "groupSecondPass",
  workflow: "groupWorkflow",
  helper: "groupHelper",
  observer: "groupObserver",
  gate: "groupGate",
};

export function groupConsoleItems(items: readonly AgentConsoleItem[]): AgentConsoleGroup[] {
  const buckets = new Map<string, AgentConsoleItem[]>();
  for (const item of items) {
    const list = buckets.get(item.kind);
    if (list) list.push(item);
    else buckets.set(item.kind, [item]);
  }
  const groups: AgentConsoleGroup[] = [];
  for (const kind of KIND_ORDER) {
    const list = buckets.get(kind);
    if (!list) continue;
    groups.push({ kind, items: list });
    buckets.delete(kind);
  }
  const gate = buckets.get("gate");
  if (gate) {
    groups.push({ kind: "gate", items: gate });
    buckets.delete("gate");
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
  const key = GROUP_LABEL[kind as keyof typeof GROUP_LABEL];
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
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(startedAt),
  );
}

export function dispositionLabel(
  disposition: AgentConsoleFindingDisposition,
  copy: AgentConsoleCopy,
): string {
  if (disposition === "kept") return copy.kept;
  if (disposition === "downgraded") return copy.downgraded;
  return copy.dismissed;
}
