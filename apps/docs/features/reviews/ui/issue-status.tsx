import { Badge, StatusLabel } from "@zedtech/zedkit-ui";

import type { ReviewsCopy } from "../i18n/reviews-copy";
import type { LatestStatus } from "../ports/review-port";
import { latestStatusBadge, STATUS_BADGE, STATUS_TONE, VERDICT_BADGE } from "./review-badges";

export function LatestStatusMark({ status, copy }: { status: LatestStatus; copy: ReviewsCopy }) {
  const mark = latestStatusBadge(status);
  if (mark.kind === "verdict" && mark.verdict !== undefined) {
    return <Badge variant={VERDICT_BADGE[mark.verdict]}>{copy.verdict[mark.verdict]}</Badge>;
  }
  if (mark.status === "running") {
    return <StatusLabel tone={STATUS_TONE.running}>{copy.status.running}</StatusLabel>;
  }
  if (mark.status === "completed" || mark.status === "failed") {
    return <Badge variant={STATUS_BADGE[mark.status]}>{copy.status[mark.status]}</Badge>;
  }
  return null;
}
