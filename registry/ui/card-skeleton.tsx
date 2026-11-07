"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { surfaceVariants } from "@/components/ui/surface";
import { cn } from "@/lib/utils";
import { useUiMessages } from "@/components/ui/ui-provider";

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
        <Skeleton data-card-skeleton-title="" className="w-skeleton-third" />
        <Skeleton className="h-skeleton-line w-skeleton-short" />
      </div>
      <div className="mt-card-section space-y-card-lines">
        <Skeleton className="h-skeleton-line w-full" />
        <Skeleton className="h-skeleton-line w-full" />
        <Skeleton className="h-skeleton-line w-skeleton-body" />
      </div>
    </div>
  );
}
