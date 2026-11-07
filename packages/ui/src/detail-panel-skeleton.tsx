"use client";

import { Skeleton } from "./skeleton.js";
import { cn } from "./utils.js";
import { useUiMessages } from "./ui-provider.js";

export interface DetailPanelSkeletonProps {
  label?: string;
  rows?: number;
  className?: string;
}

/**
 * Faithful loading shape of DetailPanel: label/value skeleton pairs
 * in the same divided box, so rows land without shifting.
 */
export function DetailPanelSkeleton({ label, rows = 4, className }: DetailPanelSkeletonProps) {
  const messages = useUiMessages();
  return (
    <div
      data-slot="detail-panel-skeleton"
      role="status"
      aria-label={label ?? messages.loading}
      className={cn("divide-y divide-border rounded-lg border", className)}
    >
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="grid grid-cols-3 gap-stack-lg px-stack-lg py-stack-md">
          <Skeleton className="h-stack-lg w-stack-11xl" />
          <Skeleton className="col-span-2 h-stack-lg w-2/3" />
        </div>
      ))}
    </div>
  );
}
