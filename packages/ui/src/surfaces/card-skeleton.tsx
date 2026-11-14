"use client";

import type * as React from "react";
import { Skeleton } from "../feedback/skeleton.js";
import { surfaceVariants } from "./surface.js";
import { cn } from "../utils.js";
import { useUiMessages } from "../ui-provider.js";

export interface CardSkeletonProps extends React.ComponentProps<"div"> {
  label?: string;
  /** Same sizing recipe as Card. */
  size?: "sm" | "lg" | undefined;
  /** False when nested under a composed route skeleton (one wrapper status). */
  announce?: boolean;
}

/**
 * Faithful loading shape of Card: header block plus three text lines
 * in the same bordered box, so content lands without shifting.
 */
export function CardSkeleton({
  label,
  className,
  size,
  announce = true,
  ...props
}: CardSkeletonProps) {
  const messages = useUiMessages();
  return (
    <div
      data-slot="card-skeleton"
      data-size={size}
      {...(announce
        ? { role: "status" as const, "aria-label": label ?? messages.loading }
        : { "aria-hidden": true as const })}
      className={cn(
        surfaceVariants({ variant: "solid", elevation: 2, radius: "xl" }),
        "rounded-(--zk-card-radius)",
        className,
      )}
      {...props}
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
