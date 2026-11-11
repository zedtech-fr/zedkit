export type IssueState = "open" | "closed";
export type TimelineEntryType = "plan" | "implement" | "review" | "improve" | "dry-run";
export type TimelineEntryStatus = "running" | "completed" | "failed";
export type ReviewVerdict = "approve" | "request-changes" | "comment";
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

export type ReviewPort = {
  listIssues(): Promise<IssueRecord[]>;
  listUnlinkedPullRequests(): Promise<UnlinkedPullRequest[]>;
  listPullRequests(): Promise<PullRequestIndexEntry[]>;
  getIssue(n: number): Promise<IssueRecord | null>;
  getUnlinkedPullRequest(n: number): Promise<UnlinkedPullRequest | null>;
  getRun(issueNumber: number, runId: string): Promise<RunRecord | null>;
  getUnlinkedRun(prNumber: number, runId: string): Promise<RunRecord | null>;
  resolvePr(n: number): Promise<PrResolve | null>;
};
