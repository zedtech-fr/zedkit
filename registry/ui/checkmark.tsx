import { cn } from "@/lib/utils";

export interface CheckmarkProps {
  /** Accessible name; omitted means decorative (pair with visible text). */
  label?: string;
  className?: string;
}

/**
 * Success check that draws itself once (static full check under
 * reduced motion — see `zk-check-draw` in styles.css).
 */
export function Checkmark({ label, className }: CheckmarkProps) {
  return (
    <svg
      data-slot="checkmark"
      viewBox="0 0 16 16"
      fill="none"
      {...(label === undefined
        ? { "aria-hidden": true as const }
        : { role: "img" as const, "aria-label": label })}
      className={cn("size-4 text-success", className)}
    >
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.5 8.2 7.2 9.9 10.6 6.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={8}
        className="motion-safe:animate-check-draw"
      />
    </svg>
  );
}
