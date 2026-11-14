"use client";

import { Skeleton } from "../feedback/skeleton.js";
import { CardSkeleton } from "../surfaces/card-skeleton.js";
import { cn } from "../utils.js";
import { useUiMessages } from "../ui-provider.js";
import { DetailPanelSkeleton } from "./detail-panel-skeleton.js";
import { PageHeaderSkeleton } from "./page-header-skeleton.js";

const DEFAULT_LIST_CARDS = 3;
const MAX_LIST_CARDS = 8;

function clampCount(value: number, fallback: number, max: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(0, Math.trunc(value)));
}

export interface DocsPageSkeletonProps {
  label?: string;
  className?: string;
}

export interface ListPageSkeletonProps {
  label?: string;
  cards?: number;
  className?: string;
}

export interface DetailPageSkeletonProps {
  label?: string;
  rows?: number;
  className?: string;
}

/** Title, prose lines, and a code-well block — the shape of a docs article. */
export function DocsPageSkeleton({ label, className }: DocsPageSkeletonProps) {
  const messages = useUiMessages();
  return (
    <div
      data-slot="docs-page-skeleton"
      role="status"
      aria-label={label ?? messages.loading}
      className={cn("flex flex-col gap-stack-md", className)}
    >
      <Skeleton className="h-skeleton-title w-skeleton-half" />
      <Skeleton className="h-skeleton-line w-full" />
      <Skeleton className="h-skeleton-line w-skeleton-wide" />
      <Skeleton className="h-skeleton-line w-skeleton-body" />
      <div className="flex flex-col gap-stack-sm rounded-lg border bg-card p-card-padding">
        <Skeleton className="h-skeleton-line w-skeleton-wide" />
        <Skeleton className="h-skeleton-line w-full" />
        <Skeleton className="h-skeleton-line w-skeleton-body" />
      </div>
    </div>
  );
}

/** Page header plus a list of cards — catalog / issues wait. */
export function ListPageSkeleton({
  label,
  cards = DEFAULT_LIST_CARDS,
  className,
}: ListPageSkeletonProps) {
  const messages = useUiMessages();
  const count = clampCount(cards, DEFAULT_LIST_CARDS, MAX_LIST_CARDS);
  return (
    <div
      data-slot="list-page-skeleton"
      role="status"
      aria-label={label ?? messages.loading}
      className={cn("flex flex-col gap-stack-lg", className)}
    >
      <PageHeaderSkeleton announce={false} />
      {Array.from({ length: count }, (_, index) => (
        <CardSkeleton key={index} announce={false} />
      ))}
    </div>
  );
}

/** Page header plus a detail panel — item wait. */
export function DetailPageSkeleton({ label, rows, className }: DetailPageSkeletonProps) {
  const messages = useUiMessages();
  return (
    <div
      data-slot="detail-page-skeleton"
      role="status"
      aria-label={label ?? messages.loading}
      className={cn("flex flex-col gap-stack-lg", className)}
    >
      <PageHeaderSkeleton announce={false} />
      <DetailPanelSkeleton announce={false} {...(rows === undefined ? {} : { rows })} />
    </div>
  );
}
