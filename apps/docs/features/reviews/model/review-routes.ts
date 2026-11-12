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

function orPlaceholder<T>(params: T[], placeholder: T): T[] {
  return params.length > 0 ? params : [placeholder];
}

function prParams(rows: readonly { number: number }[]): { n: string }[] {
  return rows.map((row) => ({ n: String(row.number) }));
}

function runParams<T extends { number: number }>(
  rows: readonly T[],
  runIdsOf: (row: T) => readonly string[],
): { n: string; id: string }[] {
  return rows.flatMap((row) =>
    uniqueRunIds(runIdsOf(row)).map((id) => ({ n: String(row.number), id })),
  );
}

function pushRunTree(
  paths: string[],
  rows: readonly { number: number; entries: readonly { runId: string }[] }[],
  itemPath: (n: number) => string,
  runPath: (n: number, id: string) => string,
): void {
  for (const row of rows) {
    paths.push(itemPath(row.number));
    for (const id of uniqueRunIds(row.entries.map((entry) => entry.runId))) {
      paths.push(runPath(row.number, id));
    }
  }
}

export async function listIssueParamsFrom(port: ReviewPort) {
  return orPlaceholder(prParams(await port.listIssues()), ISSUE_STATIC_PLACEHOLDER);
}

export async function listIssueRunParamsFrom(port: ReviewPort) {
  return orPlaceholder(
    runParams(await port.listIssues(), (issue) => issue.entries.map((entry) => entry.runId)),
    ISSUE_RUN_STATIC_PLACEHOLDER,
  );
}

export async function listUnlinkedPrParamsFrom(port: ReviewPort) {
  return orPlaceholder(prParams(await port.listUnlinkedPullRequests()), ISSUE_STATIC_PLACEHOLDER);
}

export async function listUnlinkedRunParamsFrom(port: ReviewPort) {
  return orPlaceholder(
    runParams(await port.listUnlinkedPullRequests(), (entry) =>
      entry.entries.map((item) => item.runId),
    ),
    ISSUE_RUN_STATIC_PLACEHOLDER,
  );
}

export async function listReviewPrParamsFrom(port: ReviewPort) {
  return orPlaceholder(prParams(await port.listPullRequests()), ISSUE_STATIC_PLACEHOLDER);
}

export async function listReviewRunParamsFrom(port: ReviewPort) {
  return orPlaceholder(
    runParams(await port.listPullRequests(), (entry) => entry.runIds),
    ISSUE_RUN_STATIC_PLACEHOLDER,
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

/** `/issues/pr/:n` for a linked PR should send the visitor to the issue, not a 404. */
export function linkedPrFallbackPath(issueNumber: number | null): string | null {
  return issueNumber === null ? null : issuePath(issueNumber);
}

export function linkedPrRunFallbackPath(issueNumber: number | null, runId: string): string | null {
  return issueNumber === null ? null : issueRunPath(issueNumber, runId);
}

export async function listIssueSitemapPathsFrom(port: ReviewPort) {
  const issues = await port.listIssues();
  const unlinked = await port.listUnlinkedPullRequests();
  const paths = ["/issues"];
  pushRunTree(paths, issues, issuePath, issueRunPath);
  pushRunTree(paths, unlinked, unlinkedPrPath, unlinkedRunPath);
  return paths;
}

export async function issueIndexRobotsFrom(
  port: ReviewPort,
): Promise<{ index: false } | undefined> {
  if (await port.hasLoadError()) return { index: false };
  return undefined;
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

/**
 * Pre-issue-centric public PR numbers; stub so old `/reviews/pr/:n` links do not 404.
 * Run-level retired URLs (`/reviews/pr/:n/runs/:id`) stay 404: run ids are unknowable once retired.
 * Dev/server runtime has no stubs; only the static-export HTML files redirect.
 */
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
