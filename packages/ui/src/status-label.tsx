import { WifiOff } from "lucide-react";

import { Checkmark } from "./checkmark.js";
import { StatusDot } from "./status-dot.js";
import { cn } from "./utils.js";

export type StatusLabelTone = "loading" | "updating" | "syncing" | "saved" | "retry" | "error" | "offline";

export interface StatusLabelProps {
  tone: StatusLabelTone;
  children: React.ReactNode;
  className?: string;
}

function ToneIcon({ tone }: { tone: StatusLabelTone }) {
  switch (tone) {
    case "saved":
      return <Checkmark />;
    case "retry":
      return <StatusDot tone="warning" />;
    case "error":
      return <StatusDot tone="danger" />;
    case "offline":
      return <WifiOff aria-hidden className="size-3.5 text-muted-foreground" />;
    case "loading":
    case "updating":
    case "syncing":
      return <StatusDot tone="active" />;
  }
}

/**
 * Named inline status: icon + text, announced politely (`role=status`).
 * Name the operation ("Saving report…", not "Loading…") so a worried
 * user always knows what is happening and where.
 */
export function StatusLabel({ tone, children, className }: StatusLabelProps) {
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-1.5 text-xs",
        tone === "error" ? "text-destructive" : "text-muted-foreground",
        className,
      )}
    >
      <span className="flex size-4 shrink-0 items-center justify-center">
        <ToneIcon tone={tone} />
      </span>
      {children}
    </span>
  );
}
