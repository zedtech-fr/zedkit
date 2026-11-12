import type {
  LiveDecision,
  LiveEntry,
  LiveItemDetail,
  LiveRunInfo,
  LiveVerdict,
  PublicLiveRun,
} from "../ports/review-port";

type FindingDisposition = "kept" | "downgraded" | "dismissed";

type MappedFinding = {
  id: string;
  text: string;
  disposition: FindingDisposition;
};

type MappedEntry =
  | { id: string; kind: "tool"; name: string; body?: string; status?: string; durationMs?: number | null }
  | { id: string; kind: "message"; text: string }
  | { id: string; kind: "reasoning"; text: string; live?: boolean };

type MappedItem = {
  id: string;
  name: string;
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
  entries: readonly MappedEntry[];
};

type MappedRun = {
  pr: number | null;
  sha: string | null;
  engineLabel: string;
  durationMs: number | null;
  reviewSize: string | null;
  verdict: string | null;
  confidence: number | null;
  postedReviewHref: string | null;
};

type MappedNote = { text: string; tag?: "downgraded" | "approved" | null };

type MappedDecision = {
  verdict: string | null;
  confidence: number | null;
  posted: boolean;
  postedReviewHref: string | null;
  summary: string | null;
  mustChange: readonly { text: string }[];
  notes: readonly MappedNote[];
  dismissed: readonly string[];
  firstPass: {
    verdict: string | null;
    confidence: number | null;
    findings: readonly MappedFinding[];
  } | null;
  secondPass: { model: string | null; blocksMerge: boolean | null; summary: string | null } | null;
};

export type MappedAgentConsole = {
  run: MappedRun;
  items: readonly MappedItem[];
  decision: MappedDecision | null;
};

const DISPOSITIONS = new Set<FindingDisposition>(["kept", "downgraded", "dismissed"]);

function secondsToMs(value: number | null | undefined): number | null {
  return value == null ? null : value * 1000;
}

function itemText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  const file = typeof record.file === "string" ? record.file : "";
  const line = record.line == null ? "" : `:${String(record.line)}`;
  const body = String(record.issue ?? record.text ?? record.message ?? record.finding ?? "");
  return file ? `${file}${line} — ${body}` : body;
}

function dispositionOf(value: unknown): FindingDisposition | null {
  if (value === null || typeof value !== "object") return null;
  const raw = (value as Record<string, unknown>)._disposition;
  if (typeof raw !== "string" || !DISPOSITIONS.has(raw as FindingDisposition)) return null;
  return raw as FindingDisposition;
}

function findingsFromVerdict(verdict: LiveVerdict | null): MappedFinding[] {
  if (verdict === null) return [];
  const rows = [...(verdict.blocking ?? []), ...(verdict.notes ?? [])];
  const findings: MappedFinding[] = [];
  rows.forEach((row, index) => {
    const disposition = dispositionOf(row);
    if (disposition === null) return;
    const text = itemText(row).trim();
    if (text.length === 0) return;
    findings.push({ id: `finding-${index}`, text, disposition });
  });
  return findings;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function mapFirstPass(
  decision: LiveDecision | null,
  verdict: LiveVerdict | null,
): MappedDecision["firstPass"] {
  const firstPass = asRecord(decision?.first_pass);
  if (firstPass === null) return null;
  const verdictText = typeof firstPass.verdict === "string" ? firstPass.verdict : null;
  const confidence = typeof firstPass.confidence_score === "number" ? firstPass.confidence_score : null;
  const findings = Array.isArray(firstPass.findings)
    ? firstPass.findings.flatMap((row, index) => {
        const record = asRecord(row);
        if (record === null) return [];
        const disposition = dispositionOf(record);
        const text = itemText(record).trim();
        if (disposition === null || text.length === 0) return [];
        const id = typeof record.id === "string" ? record.id : `finding-${index}`;
        return [{ id, text, disposition }];
      })
    : findingsFromVerdict(verdict);
  if (verdictText === null && confidence === null && findings.length === 0) return null;
  return { verdict: verdictText, confidence, findings };
}

function mapSecondPass(decision: LiveDecision | null): MappedDecision["secondPass"] {
  const secondPass = asRecord(decision?.second_pass);
  if (secondPass === null) return null;
  return {
    model: typeof secondPass.model === "string" ? secondPass.model : null,
    blocksMerge: typeof secondPass.blocks_merge === "boolean" ? secondPass.blocks_merge : null,
    summary: typeof secondPass.summary === "string" ? secondPass.summary : null,
  };
}

function mapEntry(entry: LiveEntry, itemId: string, index: number): MappedEntry | null {
  const id = entry.id ?? `${itemId}-${index}`;
  if (entry.type === "tool") {
    const mapped: Extract<MappedEntry, { kind: "tool" }> = {
      id,
      kind: "tool",
      name: entry.label || entry.tool || "",
    };
    if (typeof entry.output === "string") mapped.body = entry.output;
    if (entry.status !== undefined) mapped.status = entry.status;
    if (entry.duration_ms !== undefined) mapped.durationMs = entry.duration_ms;
    return mapped;
  }
  if (entry.type === "reasoning") {
    const mapped: Extract<MappedEntry, { kind: "reasoning" }> = { id, kind: "reasoning", text: entry.text ?? "" };
    if (entry.live !== undefined) mapped.live = entry.live;
    return mapped;
  }
  if (entry.type === "message") {
    return { id, kind: "message", text: entry.text ?? "" };
  }
  return null;
}

function mapItem(item: LiveItemDetail): MappedItem {
  const status = item.status;
  return {
    id: item.id,
    name: item.name,
    kind: item.kind,
    status,
    model: item.model,
    durationMs: secondsToMs(item.duration_s),
    toolCount: item.tool_count,
    startedAt: item.started_ms ?? null,
    lastActivityAt: item.last_activity_ms ?? null,
    tokensIn: item.tokens_in,
    tokensOut: item.tokens_out,
    running: status === "running" || status === "starting",
    entries: item.entries.flatMap((entry, index) => {
      const mapped = mapEntry(entry, item.id, index);
      return mapped === null ? [] : [mapped];
    }),
  };
}

function postedReviewHref(decision: LiveDecision | null, run: LiveRunInfo): string | null {
  const href = decision?.review_url ?? run.review_url ?? null;
  return href ?? null;
}

function mapRun(live: PublicLiveRun): MappedRun {
  return {
    pr: live.run.pr ?? null,
    sha: live.run.sha ?? null,
    engineLabel: live.run.engine_label,
    durationMs: secondsToMs(live.run.elapsed_s),
    reviewSize: live.run.review_size ?? null,
    verdict: live.decision?.verdict ?? live.run.verdict ?? null,
    confidence: live.decision?.confidence_score ?? live.run.confidence_score ?? null,
    postedReviewHref: postedReviewHref(live.decision, live.run),
  };
}

function mapDecision(live: PublicLiveRun): MappedDecision | null {
  if (live.decision === null) return null;
  return {
    verdict: live.decision.verdict ?? null,
    confidence: live.decision.confidence_score ?? null,
    posted: live.decision.posted,
    postedReviewHref: postedReviewHref(live.decision, live.run),
    summary: live.decision.summary ?? null,
    mustChange: live.decision.must.map((item) => ({ text: item.text })),
    notes: live.decision.notes.map((item) => {
      const note: MappedNote = { text: item.text };
      if (item.tag !== undefined) note.tag = item.tag;
      return note;
    }),
    dismissed: live.decision.dismissed,
    firstPass: mapFirstPass(live.decision, live.verdict_json),
    secondPass: mapSecondPass(live.decision),
  };
}

/** Live row → kit console props. Confidence stays /10. Never copies prompt or final_text. */
export function toAgentConsole(live: PublicLiveRun): MappedAgentConsole {
  return {
    run: mapRun(live),
    items: live.items.map(mapItem),
    decision: mapDecision(live),
  };
}
