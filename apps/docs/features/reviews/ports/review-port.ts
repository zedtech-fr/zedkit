export type ReviewVerdict = "approve" | "request-changes" | "comment" | "error";
export type ReviewRunStatus = "running" | "done" | "error";
export type ReviewPrState = "open" | "merged";
export type ReviewVisibility = "public" | "private";

export type ReviewAction = {
  readonly title: string;
  readonly detail: string;
};

export type ReviewRun = {
  readonly id: string;
  readonly status: ReviewRunStatus;
  readonly startedAt: string;
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
  readonly runs: readonly ReviewRun[];
};

export type ReviewPort = {
  list(): Promise<ReviewRecord[]>;
  getByPr(n: number): Promise<ReviewRecord | null>;
  getRun(n: number, id: string): Promise<ReviewRun | null>;
};
