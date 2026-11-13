import { Badge } from "@zedtech/zedkit-ui";

import type { ReviewsCopy } from "../i18n/reviews-copy";
import type { LatestStatus } from "../ports/review-port";
import { latestStatusBadge, STATUS_BADGE, VERDICT_BADGE } from "./review-badges";

export function LatestStatusMark({
  status,
  copy,
  score = null,
}: {
  status: LatestStatus;
  copy: ReviewsCopy;
  score?: number | null;
}) {
  const mark = latestStatusBadge(status);
  if (mark.kind === "verdict" && mark.verdict !== undefined) {
    const label =
      typeof score === "number"
        ? `${copy.verdict[mark.verdict]} · ${score}/10`
        : copy.verdict[mark.verdict];
    return <Badge variant={VERDICT_BADGE[mark.verdict]}>{label}</Badge>;
  }
  if (mark.status !== undefined) {
    return <Badge variant={STATUS_BADGE[mark.status]}>{copy.status[mark.status]}</Badge>;
  }
  return null;
}
