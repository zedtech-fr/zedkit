import type { BadgeProps, StatusDotTone } from "@zedtech/zedkit-ui";

import type { HeadlineOutcome } from "../model/latest-status";
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

export function outcomeDotTone(outcome: HeadlineOutcome | null): StatusDotTone {
  if (outcome?.status === "running") return "active";
  if (outcome?.status === "failed") return "danger";
  if (outcome?.verdict === "request-changes") return "warning";
  if (outcome?.verdict === "approve") return "success";
  return "idle";
}

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
