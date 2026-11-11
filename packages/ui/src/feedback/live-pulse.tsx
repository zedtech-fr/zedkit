"use client";

import { StatusDot } from "./status-dot.js";
import { cn } from "../utils.js";
import { useUiMessages } from "../ui-provider.js";

export interface LivePulseProps {
  active?: boolean;
  label?: string;
  /** Idle copy when `active` is false. Empty string hides the word (dot only). */
  inactiveLabel?: string;
  className?: string;
}

export function LivePulse({ active = true, label, inactiveLabel, className }: LivePulseProps) {
  const messages = useUiMessages();
  const activeLabel = label ?? messages.live;
  const shown = active ? activeLabel : (inactiveLabel ?? messages.idle);
  return (
    <span
      data-slot="live-pulse"
      role="status"
      aria-label={shown}
      className={cn("inline-flex items-center gap-icon text-caption text-muted-foreground", className)}
    >
      <StatusDot tone={active ? "success" : "idle"} pulse={active} />
      {shown}
    </span>
  );
}
