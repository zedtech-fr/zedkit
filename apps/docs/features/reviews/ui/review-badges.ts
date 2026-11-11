import type { BadgeProps } from "@zedtech/zedkit-ui";

import type { LatestStatus, ReviewVerdict, TimelineEntryStatus } from "../ports/review-port";

export const VERDICT_BADGE: Record<ReviewVerdict, BadgeProps["variant"]> = {
  approve: "success",
  "request-changes": "warning",
  comment: "secondary",
};

export const STATUS_BADGE: Record<TimelineEntryStatus, BadgeProps["variant"]> = {
  running: "secondary",
  completed: "success",
  failed: "destructive",
};

export function latestStatusBadge(status: LatestStatus): {
  kind: "verdict" | "status";
  verdict?: ReviewVerdict;
  status?: TimelineEntryStatus;
} {
  if (status === "approve" || status === "request-changes" || status === "comment") {
    return { kind: "verdict", verdict: status };
  }
  return { kind: "status", status };
}
