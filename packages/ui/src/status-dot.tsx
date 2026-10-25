import { cn } from "./utils.js";

export type StatusDotTone = "active" | "idle" | "success" | "warning" | "danger";

export interface StatusDotProps {
  tone?: StatusDotTone;
  /** Override the default ping (ongoing tones ping, others stay static). */
  pulse?: boolean;
  className?: string;
}

const TONE_COLOR: Record<StatusDotTone, string> = {
  active: "bg-primary",
  idle: "bg-muted-foreground/40",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
};

const PING_TONES: ReadonlySet<StatusDotTone> = new Set(["active", "warning", "danger"]);

/**
 * Decorative status dot: pings for ongoing tones (motion-safe), static
 * otherwise. Pair with visible text (e.g. StatusLabel) — never alone.
 */
export function StatusDot({ tone = "active", pulse, className }: StatusDotProps) {
  const color = TONE_COLOR[tone];
  const ping = pulse ?? PING_TONES.has(tone);
  return (
    <span aria-hidden className={cn("relative flex size-2", className)}>
      {ping ? (
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-60 motion-safe:animate-ping",
            color,
          )}
        />
      ) : null}
      <span className={cn("relative inline-flex size-2 rounded-full", color)} />
    </span>
  );
}
