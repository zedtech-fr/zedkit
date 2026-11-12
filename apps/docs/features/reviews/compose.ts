import { tryCatch } from "@zedtech/zedkit-core";

import { createSiteReviewPort } from "./adapters/live.ts";
import { publicIssueHrefFrom, type PublicIssueHrefPort } from "./model/public-issue-href.ts";

export { publicIssueHrefFrom, type PublicIssueHrefPort } from "./model/public-issue-href.ts";

/** Public run-history URL. Falls back to `/issues`. */
export async function publicIssueHref(
  createPort: () => PublicIssueHrefPort = createSiteReviewPort,
): Promise<string> {
  const created = tryCatch(createPort);
  if (!created.ok) return "/issues";
  return publicIssueHrefFrom(created.value);
}
