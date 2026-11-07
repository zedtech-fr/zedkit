"use client";

import { Skeleton } from "./skeleton.js";
import { cn } from "./utils.js";
import { useUiMessages } from "./ui-provider.js";

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
  label,
  description = true,
  actions = true,
  className,
}: PageHeaderSkeletonProps) {
  const messages = useUiMessages();
  return (
    <div
      data-slot="page-header-skeleton"
      role="status"
      aria-label={label ?? messages.loading}
      className={cn("mb-page-header-offset flex flex-col gap-page-header-title-gap", className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-stack-lg">
        <Skeleton className="h-stack-3xl w-stack-14xl" />
        {actions ? (
          <div className="flex items-center gap-stack-sm">
            <Skeleton className="h-stack-5xl w-stack-12xl" />
            <Skeleton className="h-stack-5xl w-stack-12xl" />
          </div>
        ) : null}
      </div>
      {description ? <Skeleton className="h-stack-lg w-stack-15xl" /> : null}
    </div>
  );
}
