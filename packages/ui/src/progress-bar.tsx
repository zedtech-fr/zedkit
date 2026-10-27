import { cn } from "./utils.js";

export interface ProgressBarProps {
  /** Current value, clamped to 0..max (`NaN` reads as empty). */
  value: number;
  max?: number;
  /** Accessible name (kept screen-only — pair with visible text). */
  label: string;
  className?: string;
}

const SEGMENTS = 10;

/**
 * Determinate progress as filled segments (exact value stays in
 * `aria-valuenow`). No animation, so nothing to disable for reduced
 * motion. Announce the operation with visible text (e.g. StatusLabel)
 * next to it — the label here stays screen-only.
 */
export function ProgressBar({ value, max = 100, label, className }: ProgressBarProps) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const safeValue = Number.isFinite(value) ? Math.min(Math.max(value, 0), safeMax) : 0;
  const filled = Math.round((safeValue / safeMax) * SEGMENTS);
  return (
    <div
      data-slot="progress-bar"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={Math.round(safeValue)}
      className={cn("flex w-full gap-progress-bar-gap", className)}
    >
      {Array.from({ length: SEGMENTS }, (_, index) => (
        <span
          key={index}
          aria-hidden
          className={cn(
            "h-progress-bar-height flex-1 rounded-full motion-safe:transition-colors",
            index < filled ? "bg-primary" : "bg-muted",
          )}
        />
      ))}
    </div>
  );
}
