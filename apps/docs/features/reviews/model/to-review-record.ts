import type {
  FindingDisposition,
  LiveDecision,
  LiveItemDetail,
  LiveVerdict,
  PublicLiveRun,
  ReviewAction,
  ReviewAgentSummary,
  ReviewConsoleItem,
  ReviewConsoleKind,
  ReviewFinding,
  ReviewFirstPassFinding,
  ReviewRecord,
  ReviewRun,
  ReviewRecordVerdict,
  ReviewRunStatus,
} from "../ports/review-port";

const DISPOSITIONS = new Set<FindingDisposition>(["kept", "downgraded", "dismissed"]);

function mapVerdict(value: string | null | undefined): ReviewRecordVerdict {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("_", "-");
  if (normalized === "approve" || normalized === "request-changes" || normalized === "comment") {
    return normalized;
  }
  return "error";
}

function mapStatus(value: string | null | undefined): ReviewRunStatus {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "running" || normalized === "starting") return "running";
  if (normalized === "error" || normalized === "failed") return "error";
  return "done";
}

function mapConsoleKind(kind: string): ReviewConsoleKind {
  if (kind === "main") return "flow";
  if (kind === "workflow") return "workflow";
  return "agent";
}

function isoFromUnixSeconds(value: number): string {
  return new Date(value * 1000).toISOString();
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

function findingsFromVerdict(verdict: LiveVerdict | null): {
  findings: ReviewFinding[];
  firstPass: ReviewFirstPassFinding[];
} {
  if (verdict === null) return { findings: [], firstPass: [] };
  const rows = [...(verdict.blocking ?? []), ...(verdict.notes ?? [])];
  const findings: ReviewFinding[] = [];
  const firstPass: ReviewFirstPassFinding[] = [];
  rows.forEach((row, index) => {
    const disposition = dispositionOf(row);
    if (disposition === null) return;
    const text = itemText(row).trim();
    if (text.length === 0) return;
    findings.push({ id: `finding-${index}`, summary: text, disposition });
    firstPass.push({ title: text, detail: text, disposition });
  });
  return { findings, firstPass };
}

function actionsFromDecision(decision: LiveDecision | null): ReviewAction[] {
  return (decision?.must ?? []).map((item) => ({ title: item.text, detail: item.text }));
}

function notesFromDecision(decision: LiveDecision | null): string {
  return (decision?.notes ?? [])
    .map((item) => item.text.trim())
    .filter((text) => text.length > 0)
    .join("\n");
}

function agentsFromItems(items: readonly LiveItemDetail[]): ReviewAgentSummary[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    kind: item.kind,
    status: item.status,
    model: item.model,
  }));
}

function consoleItemsFromLive(items: readonly LiveItemDetail[]): ReviewConsoleItem[] {
  return items.map((item) => ({
    id: item.id,
    kind: mapConsoleKind(item.kind),
    title: item.name,
    status: mapStatus(item.status),
  }));
}

function runFromLive(live: PublicLiveRun): ReviewRun {
  return {
    id: live.run.run_id,
    status: mapStatus(live.run.status),
    startedAt: isoFromUnixSeconds(live.run.created_at),
    agents: agentsFromItems(live.items),
    items: consoleItemsFromLive(live.items),
  };
}

/** Temporary live → current list/PR/run props. #139 deletes this. */
export function toReviewRecord(
  live: PublicLiveRun,
  catalog: readonly PublicLiveRun[] = [],
): ReviewRecord {
  const pr = live.run.pr ?? 0;
  const title = live.run.issue_title?.trim() || live.run.target_label?.trim() || `PR #${pr}`;
  const startedAt = isoFromUnixSeconds(live.run.created_at);
  const { findings, firstPass } = findingsFromVerdict(live.verdict_json);
  const presentIds = new Set(catalog.map((row) => row.run.run_id));
  const relatedRuns = live.related
    .filter((row) => presentIds.has(row.run_id) && row.run_id !== live.run.run_id)
    .map((row) => catalog.find((item) => item.run.run_id === row.run_id))
    .filter((row): row is PublicLiveRun => row !== undefined)
    .map(runFromLive);
  const record: ReviewRecord = {
    number: pr,
    title,
    verdict: mapVerdict(live.decision?.verdict ?? live.run.verdict),
    confidence: (live.decision?.confidence_score ?? live.run.confidence_score ?? 0) * 10,
    status: mapStatus(live.run.status),
    headSha: live.run.sha ?? "",
    lastRunAt: startedAt,
    prState: "open",
    visibility: live.visibility,
    notes: notesFromDecision(live.decision),
    summary: live.decision?.summary?.trim() || live.verdict_json?.summary?.trim() || "",
    evidence: "",
    actions: actionsFromDecision(live.decision),
    findings,
    runs: [runFromLive(live), ...relatedRuns],
  };
  if (firstPass.length > 0) {
    return { ...record, firstPass: { findings: firstPass } };
  }
  return record;
}
