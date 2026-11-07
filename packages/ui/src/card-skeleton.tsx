"use client";

import { Skeleton } from "./skeleton.js";
import { surfaceVariants } from "./surface.js";
import { cn } from "./utils.js";
import { useUiMessages } from "./ui-provider.js";

export interface CardSkeletonProps {
  label?: string;
  className?: string;
}

/**
 * Faithful loading shape of Card: header block plus three text lines
 * in the same bordered box, so content lands without shifting.
 */
export function CardSkeleton({ label, className }: CardSkeletonProps) {
  const messages = useUiMessages();
  return (
    <div
      data-slot="card-skeleton"
      role="status"
      aria-label={label ?? messages.loading}
      className={cn(surfaceVariants({ variant: "solid", elevation: 2, radius: "xl", padding: "card" }), className)}
    >
      <div className="space-y-card-stack">
        <Skeleton className="h-stack-xl w-1/3" />
        <Skeleton className="h-stack-lg w-2/3" />
      </div>
      <div className="mt-stack-lg space-y-stack-sm">
        <Skeleton className="h-stack-lg w-full" />
        <Skeleton className="h-stack-lg w-full" />
        <Skeleton className="h-stack-lg w-4/5" />
      </div>
    </div>
  );
}
