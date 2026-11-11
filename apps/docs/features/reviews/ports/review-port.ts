export type ReviewVerdict = "approve" | "request-changes" | "comment" | "error";
export type ReviewRunStatus = "running" | "done" | "error";
export type ReviewPrState = "open" | "merged";
export type ReviewVisibility = "public" | "private";
export type FindingDisposition = "kept" | "downgraded" | "dismissed";

export type ReviewAction = {
  readonly title: string;
  readonly detail: string;
};

export type ReviewFinding = {
  readonly id: string;
  readonly summary: string;
  readonly disposition: FindingDisposition;
};

export type ReviewAgentSummary = {
  readonly id: string;
  readonly name: string;
  readonly kind: string;
  readonly status: string;
  readonly model: string;
};

export type ReviewConsoleKind = "flow" | "agent" | "workflow";

export type ReviewConsoleItem = {
  readonly id: string;
  readonly kind: ReviewConsoleKind;
  readonly title: string;
  readonly status: ReviewRunStatus;
};

export type ReviewRun = {
  readonly id: string;
  readonly status: ReviewRunStatus;
  readonly startedAt: string;
  readonly agents: readonly ReviewAgentSummary[];
  readonly items?: readonly ReviewConsoleItem[];
};

export type ReviewRecord = {
  readonly number: number;
  readonly title: string;
  readonly verdict: ReviewVerdict;
  readonly confidence: number;
  readonly status: ReviewRunStatus;
  readonly headSha: string;
  readonly lastRunAt: string;
  readonly prState: ReviewPrState;
  readonly visibility: ReviewVisibility;
  readonly notes: string;
  readonly actions: readonly ReviewAction[];
  readonly findings: readonly ReviewFinding[];
  readonly runs: readonly ReviewRun[];
};

export type ReviewPort = {
  list(): Promise<ReviewRecord[]>;
  getByPr(n: number): Promise<ReviewRecord | null>;
  getRun(n: number, id: string): Promise<ReviewRun | null>;
};
