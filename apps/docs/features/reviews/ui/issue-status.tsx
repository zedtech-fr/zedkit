import { Badge } from "@zedtech/zedkit-ui";

import type { ReviewsCopy } from "../i18n/reviews-copy";
import type { LatestStatus } from "../ports/review-port";
import { latestStatusBadge, STATUS_BADGE, VERDICT_BADGE } from "./review-badges";

export function LatestStatusMark({ status, copy }: { status: LatestStatus; copy: ReviewsCopy }) {
  const mark = latestStatusBadge(status);
  if (mark.kind === "verdict" && mark.verdict !== undefined) {
    return <Badge variant={VERDICT_BADGE[mark.verdict]}>{copy.verdict[mark.verdict]}</Badge>;
  }
  if (mark.status !== undefined) {
    return <Badge variant={STATUS_BADGE[mark.status]}>{copy.status[mark.status]}</Badge>;
  }
  return null;
}
