import { Skeleton } from "./skeleton.js";
import { cn } from "./utils.js";

export interface CardSkeletonProps {
  label?: string;
  className?: string;
}

/**
 * Faithful loading shape of Card: header block plus three text lines
 * in the same bordered box, so content lands without shifting.
 */
export function CardSkeleton({ label = "Loading", className }: CardSkeletonProps) {
  return (
    <div
      data-slot="card-skeleton"
      role="status"
      aria-label={label}
      className={cn("rounded-xl border bg-card p-card-padding shadow", className)}
    >
      <div className="space-y-card-stack">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="mt-card-section space-y-card-lines">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}
