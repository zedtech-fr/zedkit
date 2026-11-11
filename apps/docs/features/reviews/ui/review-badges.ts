import type { BadgeProps, StatusLabelTone } from "@zedtech/zedkit-ui";

import type { LatestStatus, ReviewVerdict, TimelineEntryStatus } from "../ports/review-port";

export const VERDICT_BADGE: Record<ReviewVerdict, BadgeProps["variant"]> = {
  approve: "success",
  "request-changes": "warning",
  comment: "secondary",
};

export const STATUS_TONE: Record<TimelineEntryStatus, StatusLabelTone> = {
  running: "loading",
  completed: "saved",
  failed: "error",
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
