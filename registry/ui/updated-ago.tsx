import { zedkitUiMessagesEn } from "@/components/ui/messages";
import { cn } from "@/lib/utils";
import { formatUpdatedAgo } from "@/components/ui/updated-ago-format";
import { UpdatedAgoClient } from "@/components/ui/updated-ago-client";

export interface UpdatedAgoProps {
  /** What the timestamp counts from (anything future reads as now). */
  date: Date | number;
  prefix?: string;
  className?: string;
}

/**
 * Stale-while-revalidate stamp ("Updated 3 minutes ago"): keep showing
 * the old content and let this say how old it is. Static snapshot —
 * re-render when the data refreshes.
 */
export function UpdatedAgo({ date, prefix, className }: UpdatedAgoProps) {
  const then = date instanceof Date ? date.getTime() : date;
  const fallbackPrefix = prefix ?? zedkitUiMessagesEn.updated;
  const fallback = `${fallbackPrefix} ${formatUpdatedAgo(Date.now(), then, zedkitUiMessagesEn.locale, zedkitUiMessagesEn.justNow)}`;
  return (
    <span data-slot="updated-ago" className={cn("text-xs text-muted-foreground", className)}>
      <UpdatedAgoClient then={then} fallback={fallback} {...(prefix === undefined ? {} : { prefix })} />
    </span>
  );
}
