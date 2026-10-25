import { cn } from "./utils.js";

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

const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function relativeFrom(now: number, then: number): string {
  const elapsed = Math.max(now - then, 0);
  if (elapsed < 5 * SECOND) return "just now";
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
export function UpdatedAgo({ date, prefix = "Updated", className }: UpdatedAgoProps) {
  const then = date instanceof Date ? date.getTime() : date;
  return (
    <span className={cn("text-xs text-muted-foreground", className)}>
      {prefix} {relativeFrom(Date.now(), then)}
    </span>
  );
}
