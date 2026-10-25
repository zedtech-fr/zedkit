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
      className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}
    >
      <span className="relative flex size-2">
        {active ? (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
        ) : null}
        <span
          className={cn("relative inline-flex size-2 rounded-full", active ? "bg-success" : "bg-muted-foreground/40")}
        />
      </span>
      {active ? label : "Idle"}
    </span>
  );
}
