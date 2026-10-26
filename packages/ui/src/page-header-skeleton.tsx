import { Skeleton } from "./skeleton.js";
import { cn } from "./utils.js";

export interface PageHeaderSkeletonProps {
  label?: string;
  description?: boolean;
  actions?: boolean;
  className?: string;
}

/**
 * Faithful loading shape of PageHeader: title, optional description
 * and action slots. Same box, no layout shift when content lands.
 */
export function PageHeaderSkeleton({
  label = "Loading",
  description = true,
  actions = true,
  className,
}: PageHeaderSkeletonProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn("mb-page-header-offset flex flex-wrap items-start justify-between gap-page-header-gap", className)}
    >
      <div className="space-y-1">
        <Skeleton className="h-7 w-48" />
        {description ? <Skeleton className="h-4 w-64" /> : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-page-header-actions-gap">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      ) : null}
    </div>
  );
}
