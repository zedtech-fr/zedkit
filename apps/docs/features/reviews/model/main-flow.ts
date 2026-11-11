import type {
  ReviewAction,
  ReviewFinding,
  ReviewRecord,
  ReviewRun,
  ReviewVerdict,
} from "../ports/review-port";

export type ReviewMainFlowSectionId =
  | "decision"
  | "must-change"
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
  readonly firstPass: {
    readonly findings: readonly ReviewFinding[];
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
  const findings = record.firstPass?.findings ?? [];
  const blockers = record.actions;
  const firstPass = findings.length > 0 ? { findings } : null;

  const sections: ReviewMainFlowSectionId[] = ["decision"];
  if (blockers.length > 0) sections.push("must-change");
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
    firstPass,
    notes: record.notes,
    evidence: evidenceText.length > 0 ? evidenceText : null,
    runs: record.runs,
  };
}
