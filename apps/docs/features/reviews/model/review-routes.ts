import type { ReviewPort } from "../ports/review-port";

export function issuePath(n: number): string {
  return `/issues/${n}`;
}

export function issueRunPath(n: number, runId: string): string {
  return `/issues/${n}/runs/${runId}`;
}

export function unlinkedPrPath(n: number): string {
  return `/issues/pr/${n}`;
}

export function unlinkedRunPath(n: number, runId: string): string {
  return `/issues/pr/${n}/runs/${runId}`;
}

/** Next `output: export` requires ≥1 `generateStaticParams` entry; unknown ids 404 (`dynamicParams = false`). */
export const ISSUE_STATIC_PLACEHOLDER = { n: "0" } as const;
export const ISSUE_RUN_STATIC_PLACEHOLDER = { n: "0", id: "_placeholder" } as const;

export function uniqueRunIds(runIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of runIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export async function listIssueParamsFrom(port: ReviewPort) {
  const issues = await port.listIssues();
  if (issues.length === 0) return [ISSUE_STATIC_PLACEHOLDER];
  return issues.map((issue) => ({ n: String(issue.number) }));
}

export async function listIssueRunParamsFrom(port: ReviewPort) {
  const issues = await port.listIssues();
  const params = issues.flatMap((issue) =>
    uniqueRunIds(issue.entries.map((entry) => entry.runId)).map((id) => ({
      n: String(issue.number),
      id,
    })),
  );
  return params.length > 0 ? params : [ISSUE_RUN_STATIC_PLACEHOLDER];
}

export async function listUnlinkedPrParamsFrom(port: ReviewPort) {
  const unlinked = await port.listUnlinkedPullRequests();
  return unlinked.map((entry) => ({ n: String(entry.number) }));
}

export async function listUnlinkedRunParamsFrom(port: ReviewPort) {
  const unlinked = await port.listUnlinkedPullRequests();
  return unlinked.flatMap((entry) =>
    uniqueRunIds(entry.entries.map((item) => item.runId)).map((id) => ({
      n: String(entry.number),
      id,
    })),
  );
}

export async function listReviewPrParamsFrom(port: ReviewPort) {
  const pullRequests = await port.listPullRequests();
  return pullRequests.map((entry) => ({ n: String(entry.number) }));
}

export async function listReviewRunParamsFrom(port: ReviewPort) {
  const pullRequests = await port.listPullRequests();
  return pullRequests.flatMap((entry) =>
    uniqueRunIds(entry.runIds).map((id) => ({ n: String(entry.number), id })),
  );
}

export function redirectPathForPr(issueNumber: number | null, prNumber: number): string {
  return issueNumber === null ? unlinkedPrPath(prNumber) : issuePath(issueNumber);
}

export function redirectPathForPrRun(
  issueNumber: number | null,
  prNumber: number,
  runId: string,
): string {
  return issueNumber === null ? unlinkedRunPath(prNumber, runId) : issueRunPath(issueNumber, runId);
}

export async function listIssueSitemapPathsFrom(port: ReviewPort) {
  const issues = await port.listIssues();
  const unlinked = await port.listUnlinkedPullRequests();
  const paths = ["/issues"];
  for (const issue of issues) {
    paths.push(issuePath(issue.number));
    for (const runId of uniqueRunIds(issue.entries.map((entry) => entry.runId))) {
      paths.push(issueRunPath(issue.number, runId));
    }
  }
  for (const entry of unlinked) {
    paths.push(unlinkedPrPath(entry.number));
    for (const runId of uniqueRunIds(entry.entries.map((item) => item.runId))) {
      paths.push(unlinkedRunPath(entry.number, runId));
    }
  }
  return paths;
}

export async function listReviewSitemapPathsFrom(port: ReviewPort) {
  const records = await port.list();
  const paths = ["/reviews"];
  const prs = new Set<number>();
  for (const record of records) {
    const pr = record.run.pr;
    if (typeof pr !== "number") continue;
    if (!prs.has(pr)) {
      prs.add(pr);
      paths.push(`/reviews/pr/${pr}`);
    }
    paths.push(`/reviews/pr/${pr}/runs/${record.run.run_id}`);
  }
  return paths;
}

export type ReviewRedirect = {
  readonly from: string;
  readonly to: string;
};

/** Pre-issue-centric public PR numbers; stub so old /reviews/pr/:n links do not 404. */
export const RETIRED_REVIEW_PR_NUMBERS = [64, 79, 80] as const;

export async function listReviewRedirectsFrom(port: ReviewPort): Promise<ReviewRedirect[]> {
  const pullRequests = await port.listPullRequests();
  const redirects: ReviewRedirect[] = [{ from: "/reviews", to: "/issues" }];
  const covered = new Set<number>();
  for (const entry of pullRequests) {
    covered.add(entry.number);
    redirects.push({
      from: `/reviews/pr/${entry.number}`,
      to: redirectPathForPr(entry.issueNumber, entry.number),
    });
    for (const runId of uniqueRunIds(entry.runIds)) {
      redirects.push({
        from: `/reviews/pr/${entry.number}/runs/${runId}`,
        to: redirectPathForPrRun(entry.issueNumber, entry.number, runId),
      });
    }
  }
  for (const n of RETIRED_REVIEW_PR_NUMBERS) {
    if (covered.has(n)) continue;
    redirects.push({ from: `/reviews/pr/${n}`, to: "/issues" });
  }
  return redirects;
}
