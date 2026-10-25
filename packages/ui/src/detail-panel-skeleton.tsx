import { Skeleton } from "./skeleton.js";
import { cn } from "./utils.js";

export interface DetailPanelSkeletonProps {
  label?: string;
  rows?: number;
  className?: string;
}

/**
 * Faithful loading shape of DetailPanel: label/value skeleton pairs
 * in the same divided box, so rows land without shifting.
 */
export function DetailPanelSkeleton({ label = "Loading", rows = 4, className }: DetailPanelSkeletonProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn("divide-y divide-border rounded-lg border", className)}
    >
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="grid grid-cols-3 gap-4 px-4 py-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="col-span-2 h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}
