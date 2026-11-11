import { tryCatch } from "@zedtech/zedkit-core";

import { createSnapshotReviewPort } from "./adapters/snapshot.ts";
import { publicIssueHrefFrom, type PublicIssueHrefPort } from "./model/public-issue-href.ts";

export { publicIssueHrefFrom, type PublicIssueHrefPort } from "./model/public-issue-href.ts";

/** Snapshot-backed public run-history URL for the home hero. Falls back to `/issues`. */
export async function publicIssueHref(
  createPort: () => PublicIssueHrefPort = createSnapshotReviewPort,
): Promise<string> {
  const created = tryCatch(createPort);
  if (!created.ok) return "/issues";
  return publicIssueHrefFrom(created.value);
}
