import type { BadgeProps, StatusLabelTone } from "@zedtech/zedkit-ui";

import type { ReviewRunStatus, ReviewVerdict } from "../ports/review-port";

export const VERDICT_BADGE: Record<ReviewVerdict, BadgeProps["variant"]> = {
  approve: "success",
  "request-changes": "warning",
  comment: "secondary",
  error: "destructive",
};

export const STATUS_TONE: Record<ReviewRunStatus, StatusLabelTone> = {
  running: "loading",
  done: "saved",
  error: "error",
};
