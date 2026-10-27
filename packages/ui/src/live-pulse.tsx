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
      data-slot="live-pulse"
      role="status"
      aria-label={active ? label : "Idle"}
      className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}
    >
      <StatusDot tone={active ? "success" : "idle"} pulse={active} />
      {active ? label : "Idle"}
    </span>
  );
}
