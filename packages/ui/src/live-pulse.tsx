import { StatusDot } from "./status-dot.js";
import { cn } from "./utils.js";

export interface LivePulseProps {
  active?: boolean;
  label?: string;
  className?: string;
}

export function LivePulse({ active = true, label = "Live", className }: LivePulseProps) {
  return (
    <span
      role="status"
      aria-label={active ? label : "Idle"}
      className={cn("inline-flex items-center gap-live-pulse-gap text-xs text-muted-foreground", className)}
    >
      <StatusDot tone={active ? "success" : "idle"} pulse={active} />
      {active ? label : "Idle"}
    </span>
  );
}
