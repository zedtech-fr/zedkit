import type {
  ReviewAction,
  ReviewFinding,
  ReviewFirstPassFinding,
  ReviewRecord,
  ReviewRun,
  ReviewVerdict,
} from "../ports/review-port";

export type ReviewMainFlowSectionId =
  | "decision"
  | "must-change"
  | "findings"
  | "first-pass"
  | "notes"
  | "evidence"
  | "run-history"
  | "agent-detail";

export type ReviewMainFlow = {
  readonly sections: readonly ReviewMainFlowSectionId[];
  readonly decision: {
    readonly verdict: ReviewVerdict;
    readonly confidence: number;
    readonly summary: string;
  };
  readonly blockers: readonly ReviewAction[];
  readonly findings: readonly ReviewFinding[];
  readonly firstPass: {
    readonly findings: readonly ReviewFirstPassFinding[];
  } | null;
  readonly notes: string;
  readonly evidence: string | null;
  readonly runs: readonly ReviewRun[];
};

function trimmed(value: string | undefined): string {
  return value?.trim() ?? "";
}

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function reviewMainFlow(record: ReviewRecord): ReviewMainFlow {
  const summary = trimmed(record.summary);
  const evidenceText = trimmed(record.evidence);
  const firstPassFindings = record.firstPass?.findings ?? [];
  const blockers = record.actions;
  const findings = record.findings;
  const firstPass = firstPassFindings.length > 0 ? { findings: firstPassFindings } : null;

  const sections: ReviewMainFlowSectionId[] = ["decision"];
  if (blockers.length > 0) sections.push("must-change");
  if (findings.length > 0) sections.push("findings");
  if (firstPass !== null) sections.push("first-pass");
  sections.push("notes");
  if (evidenceText.length > 0) sections.push("evidence");
  sections.push("run-history", "agent-detail");

  return {
    sections,
    decision: {
      verdict: record.verdict,
      confidence: clampConfidence(record.confidence),
      summary,
    },
    blockers,
    findings,
    firstPass,
    notes: record.notes,
    evidence: evidenceText.length > 0 ? evidenceText : null,
    runs: record.runs,
  };
}
