"use client";

import { StatusDot } from "./status-dot.js";
import { cn } from "../utils.js";
import { useUiMessages } from "../ui-provider.js";

export interface LivePulseProps {
  active?: boolean;
  label?: string;
  /**
   * Idle copy when `active` is false. Empty or whitespace hides the word
   * (dot only); `aria-label` stays the kit idle string. Localize this
   * string on the host — LivePulse does not translate it.
   */
  inactiveLabel?: string;
  className?: string;
}

export function LivePulse({ active = true, label, inactiveLabel, className }: LivePulseProps) {
  const messages = useUiMessages();
  const activeLabel = label ?? messages.live;
  const idleWord = inactiveLabel === undefined ? messages.idle : inactiveLabel.trim();
  const hideIdleWord = !active && idleWord === "";
  const shown = active ? activeLabel : idleWord;
  return (
    <span
      data-slot="live-pulse"
      role="status"
      aria-label={hideIdleWord ? messages.idle : shown}
      className={cn("inline-flex items-center gap-icon text-caption text-muted-foreground", className)}
    >
      <StatusDot tone={active ? "success" : "idle"} pulse={active} />
      {shown}
    </span>
  );
}
