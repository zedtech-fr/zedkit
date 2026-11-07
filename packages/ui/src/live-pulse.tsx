"use client";

import { StatusDot } from "./status-dot.js";
import { cn } from "./utils.js";
import { useUiMessages } from "./ui-provider.js";

export interface LivePulseProps {
  active?: boolean;
  label?: string;
  className?: string;
}

export function LivePulse({ active = true, label, className }: LivePulseProps) {
  const messages = useUiMessages();
  const activeLabel = label ?? messages.live;
  const shown = active ? activeLabel : messages.idle;
  return (
    <span
      data-slot="live-pulse"
      role="status"
      aria-label={shown}
      className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}
    >
      <StatusDot tone={active ? "success" : "idle"} pulse={active} />
      {shown}
    </span>
  );
}
