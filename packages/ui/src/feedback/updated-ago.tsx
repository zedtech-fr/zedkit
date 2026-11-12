import { cn } from "../utils.js";
import { UpdatedAgoClient } from "./updated-ago-client.js";

export interface UpdatedAgoProps {
  /** What the timestamp counts from (anything future reads as now). */
  date: Date | number;
  prefix?: string;
  className?: string;
}

/**
 * Stale-while-revalidate stamp ("Updated 3 minutes ago"): keep showing
 * the old content and let this say how old it is. First paint is a UTC
 * calendar date so static HTML hydrates; after mount the live relative
 * string. Re-render when the data refreshes.
 */
export function UpdatedAgo({ date, prefix, className }: UpdatedAgoProps) {
  const then = date instanceof Date ? date.getTime() : date;
  return (
    <span data-slot="updated-ago" className={cn("text-caption text-muted-foreground", className)}>
      <UpdatedAgoClient then={then} {...(prefix === undefined ? {} : { prefix })} />
    </span>
  );
}
