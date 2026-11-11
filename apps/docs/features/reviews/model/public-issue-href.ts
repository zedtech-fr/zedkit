import { issuePath, unlinkedPrPath } from "./review-routes.ts";

export type PublicIssueHrefPort = {
  listIssues(): Promise<readonly { readonly number: number }[]>;
  listUnlinkedPullRequests(): Promise<readonly { readonly number: number }[]>;
};

function firstPositiveNumber(rows: readonly { readonly number: number }[]): number | undefined {
  return rows.find((row) => Number.isSafeInteger(row.number) && row.number > 0)?.number;
}

/** Snapshot-backed public run-history URL for the home hero. Never `/issues/0`. */
export async function publicIssueHrefFrom(port: PublicIssueHrefPort): Promise<string> {
  const issueNumber = firstPositiveNumber(await port.listIssues());
  if (issueNumber !== undefined) return issuePath(issueNumber);
  const prNumber = firstPositiveNumber(await port.listUnlinkedPullRequests());
  if (prNumber !== undefined) return unlinkedPrPath(prNumber);
  return "/issues";
}
