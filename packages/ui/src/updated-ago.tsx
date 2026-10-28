"use client";

import { cn } from "./utils.js";
import { useUiMessages } from "./ui-provider.js";

export interface UpdatedAgoProps {
  /** What the timestamp counts from (anything future reads as now). */
  date: Date | number;
  prefix?: string;
  className?: string;
}

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function relativeFrom(now: number, then: number, locale: string, justNow: string): string {
  const elapsed = Math.max(now - then, 0);
  if (elapsed < 5 * SECOND) return justNow;
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (elapsed < MINUTE) return formatter.format(-Math.floor(elapsed / SECOND), "second");
  if (elapsed < HOUR) return formatter.format(-Math.floor(elapsed / MINUTE), "minute");
  if (elapsed < DAY) return formatter.format(-Math.floor(elapsed / HOUR), "hour");
  return formatter.format(-Math.floor(elapsed / DAY), "day");
}

/**
 * Stale-while-revalidate stamp ("Updated 3 minutes ago"): keep showing
 * the old content and let this say how old it is. Static snapshot —
 * re-render when the data refreshes.
 */
export function UpdatedAgo({ date, prefix, className }: UpdatedAgoProps) {
  const messages = useUiMessages();
  const then = date instanceof Date ? date.getTime() : date;
  return (
    <span data-slot="updated-ago" className={cn("text-xs text-muted-foreground", className)}>
      {prefix ?? messages.updated} {relativeFrom(Date.now(), then, messages.locale, messages.justNow)}
    </span>
  );
}
