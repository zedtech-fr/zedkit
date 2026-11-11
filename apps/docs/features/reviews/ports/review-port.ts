export type IssueState = "open" | "closed";
export type TimelineEntryType = "plan" | "implement" | "review" | "improve" | "dry-run";
export type TimelineEntryStatus = "running" | "completed" | "failed";
export type ReviewVerdict = "approve" | "request-changes" | "comment";
export type ReviewRecordVerdict = ReviewVerdict | "error";
export type LatestStatus = TimelineEntryStatus | ReviewVerdict;

export type TimelineEntry = {
  readonly id: string;
  readonly runId: string;
  readonly type: TimelineEntryType;
  readonly status: TimelineEntryStatus;
  readonly startedAt: string;
  readonly durationMs: number | null;
  readonly models: readonly string[];
  readonly verdict: ReviewVerdict | null;
  readonly liveUrl: string | null;
};

export type IssueRecord = {
  readonly number: number;
  readonly title: string;
  readonly state: IssueState;
  readonly pullRequests: readonly number[];
  readonly lastRunAt: string;
  readonly entries: readonly TimelineEntry[];
};

export type PullRequestIndexEntry = {
  readonly number: number;
  readonly issueNumber: number | null;
  readonly runIds: readonly string[];
  readonly entries: readonly TimelineEntry[];
};

export type PublicIssueIndex = {
  readonly version: 1;
  readonly kind: string;
  readonly issues: readonly IssueRecord[];
  readonly pullRequests: readonly PullRequestIndexEntry[];
};

export type UnlinkedPullRequest = {
  readonly number: number;
  readonly lastRunAt: string;
  readonly entries: readonly TimelineEntry[];
};

export type RunRecord = {
  readonly runId: string;
  readonly entries: readonly TimelineEntry[];
  readonly status: TimelineEntryStatus;
  readonly verdict: ReviewVerdict | null;
  readonly models: readonly string[];
  readonly durationMs: number | null;
  readonly liveUrl: string | null;
  readonly startedAt: string;
};

export type PrResolve = {
  readonly issueNumber: number | null;
  readonly runIds: readonly string[];
};

export type ReviewRunStatus = "running" | "done" | "error";
export type ReviewPrState = "open" | "merged";
export type ReviewVisibility = "public" | "private";
export type FindingDisposition = "kept" | "downgraded" | "dismissed";
export type ReviewFindingDisposition = FindingDisposition;

export type ReviewAction = {
  readonly title: string;
  readonly detail: string;
};

export type ReviewFinding = {
  readonly id: string;
  readonly summary: string;
  readonly disposition: FindingDisposition;
};

export type ReviewFirstPassFinding = {
  readonly title: string;
  readonly detail: string;
  readonly disposition: ReviewFindingDisposition;
};

export type ReviewAgentSummary = {
  readonly id: string;
  readonly name: string;
  readonly kind: string;
  readonly status: string;
  readonly model: string;
};

export type ReviewFirstPass = {
  readonly findings: readonly ReviewFirstPassFinding[];
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

/** Temporary view-model for live rows. Deleted when pages consume live rows directly. */
export type ReviewRecord = {
  readonly number: number;
  readonly title: string;
  readonly verdict: ReviewRecordVerdict;
  readonly confidence: number;
  readonly status: ReviewRunStatus;
  readonly headSha: string;
  readonly lastRunAt: string;
  readonly prState: ReviewPrState;
  readonly visibility: ReviewVisibility;
  readonly notes: string;
  readonly summary: string;
  readonly evidence: string;
  readonly actions: readonly ReviewAction[];
  readonly findings: readonly ReviewFinding[];
  readonly firstPass?: ReviewFirstPass;
  readonly runs: readonly ReviewRun[];
};

export type LiveStatus = string;
export type LiveItemKind = string;

export type LiveEntry = {
  readonly type: "message" | "reasoning" | "tool" | string;
  readonly ts?: number | null;
  readonly text?: string;
  readonly phase?: string | null;
  readonly live?: boolean;
  readonly id?: string;
  readonly tool?: string;
  readonly label?: string;
  readonly args?: Readonly<Record<string, string>>;
  readonly status?: LiveStatus;
  readonly output?: string | null;
  readonly output_chars?: number;
  readonly duration_ms?: number | null;
};

export type LiveSecondPassResult = {
  readonly status?: string;
  readonly summary?: string;
  readonly blocks_merge?: boolean;
  readonly blocking?: readonly (Readonly<Record<string, unknown>> | string)[];
  readonly adjusted?: readonly Readonly<Record<string, unknown>>[];
  readonly dropped?: readonly unknown[];
  readonly kept?: readonly unknown[];
  readonly model?: string;
};

export type LiveItemDetail = {
  readonly id: string;
  readonly name: string;
  readonly kind: LiveItemKind;
  readonly engine: string;
  readonly engine_label: string;
  readonly model: string;
  readonly status: LiveStatus;
  readonly started_ms?: number | null;
  readonly ended_ms?: number | null;
  readonly duration_s?: number | null;
  readonly last_activity_ms?: number | null;
  readonly last_activity?: string | null;
  readonly tool_count: number;
  readonly message_count: number;
  readonly tokens_in: number;
  readonly tokens_out: number;
  readonly dropped?: number;
  readonly independent?: boolean | null;
  readonly entries: readonly LiveEntry[];
  readonly prompt: string;
  readonly final_text: string;
  readonly result?: LiveSecondPassResult;
};

export type LiveRunInfo = {
  readonly run_id: string;
  readonly pr?: number | null;
  readonly sha?: string | null;
  readonly repo?: string;
  readonly mode?: string | null;
  readonly status: string;
  readonly engine: string;
  readonly engine_label: string;
  readonly created_at: number;
  readonly elapsed_s?: number | null;
  readonly verdict?: string | null;
  readonly confidence_score?: number | null;
  readonly review_url?: string | null;
  readonly pr_url?: string | null;
  readonly review_size?: string | null;
  readonly prior_sha?: string | null;
  readonly model_validation_ok?: boolean | null;
  readonly target_label?: string | null;
  readonly kind?: string | null;
  readonly branch?: string | null;
  readonly opened_pr_url?: string | null;
  readonly issue_title?: string | null;
  readonly server_now: number;
};

export type LiveRelatedRun = {
  readonly run_id: string;
  readonly mode?: string;
  readonly status?: string;
  readonly sha?: string;
  readonly created_at?: number;
  readonly verdict?: string | null;
  readonly confidence_score?: number | null;
  readonly engine_label?: string | null;
  readonly duration_s?: number | null;
};

export type LiveVerdict = {
  readonly verdict?: string;
  readonly confidence_score?: number;
  readonly summary?: string;
  readonly mode?: string;
  readonly fallback_reason?: string;
  readonly blocking?: readonly (Readonly<Record<string, unknown>> | string)[];
  readonly notes?: readonly (Readonly<Record<string, unknown>> | string)[];
  readonly lenses_run?: readonly Readonly<Record<string, unknown>>[];
  readonly [key: string]: unknown;
};

export type LiveDecisionItem = {
  readonly text: string;
  readonly tag?: "downgraded" | "approved" | null;
};

export type LiveDecision = {
  readonly verdict?: string | null;
  readonly confidence_score?: number | null;
  readonly review_url?: string | null;
  readonly posted: boolean;
  readonly summary?: string | null;
  readonly must: readonly LiveDecisionItem[];
  readonly notes: readonly LiveDecisionItem[];
  readonly dismissed: readonly string[];
  readonly degraded: boolean;
  readonly enforcement_reasons: readonly string[];
  readonly reconcile?: Readonly<Record<string, unknown>>;
  readonly reconcile_reason?: string | null;
  readonly second_pass?: Readonly<Record<string, unknown>> | null;
  readonly first_pass?: Readonly<Record<string, unknown>> | null;
};

export type PublicLiveRun = {
  readonly visibility: ReviewVisibility;
  readonly decision: LiveDecision | null;
  readonly run: LiveRunInfo;
  readonly items: readonly LiveItemDetail[];
  readonly verdict_json: LiveVerdict | null;
  readonly related: readonly LiveRelatedRun[];
};

export function isRunRecord(value: RunRecord | PublicLiveRun): value is RunRecord {
  return "runId" in value;
}

export type ReviewPort = {
  listIssues(): Promise<IssueRecord[]>;
  listUnlinkedPullRequests(): Promise<UnlinkedPullRequest[]>;
  listPullRequests(): Promise<PullRequestIndexEntry[]>;
  getIssue(n: number): Promise<IssueRecord | null>;
  getUnlinkedPullRequest(n: number): Promise<UnlinkedPullRequest | null>;
  getRun(n: number, id: string): Promise<RunRecord | PublicLiveRun | null>;
  getUnlinkedRun(prNumber: number, runId: string): Promise<RunRecord | null>;
  resolvePr(n: number): Promise<PrResolve | null>;
  list(): Promise<PublicLiveRun[]>;
  getByPr(n: number): Promise<PublicLiveRun | null>;
};
