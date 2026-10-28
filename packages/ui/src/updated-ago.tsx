"use client";

import { useState } from "react";

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

function formatRelative(locale: string, value: number, unit: Intl.RelativeTimeFormatUnit): string {
  // Chromium puts a narrow no-break space in relative time; keep a regular space so copy stays greppable.
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(value, unit).replace(/[\u00A0\u202F]/g, " ");
}

function relativeFrom(now: number, then: number, locale: string, justNow: string): string {
  const elapsed = Math.max(now - then, 0);
  if (elapsed < 5 * SECOND) return justNow;
  if (elapsed < MINUTE) return formatRelative(locale, -Math.floor(elapsed / SECOND), "second");
  if (elapsed < HOUR) return formatRelative(locale, -Math.floor(elapsed / MINUTE), "minute");
  if (elapsed < DAY) return formatRelative(locale, -Math.floor(elapsed / HOUR), "hour");
  return formatRelative(locale, -Math.floor(elapsed / DAY), "day");
}

/**
 * Stale-while-revalidate stamp ("Updated 3 minutes ago"): keep showing
 * the old content and let this say how old it is. Static snapshot —
 * re-render when the data refreshes.
 */
export function UpdatedAgo({ date, prefix, className }: UpdatedAgoProps) {
  const messages = useUiMessages();
  const then = date instanceof Date ? date.getTime() : date;
  // Snapshot on first render (SSR HTML for static docs pages). Live Date.now()
  // on the client would drift from a build-time `date` prop.
  const [text] = useState(
    () => `${prefix ?? messages.updated} ${relativeFrom(Date.now(), then, messages.locale, messages.justNow)}`,
  );
  return (
    <span data-slot="updated-ago" className={cn("text-xs text-muted-foreground", className)}>
      {text}
    </span>
  );
}
