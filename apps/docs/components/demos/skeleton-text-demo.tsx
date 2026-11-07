import { Skeleton, Stack } from "@zedtech/zedkit-ui";
import { skeletonCopy } from "@/components/demos/i18n/skeleton-copy";

export function SkeletonTextDemo() {
  return (
    <Stack gap={3} className="content-shrink" role="status" aria-label={skeletonCopy.loadingArticle}>
      <Skeleton className="h-6 w-skeleton-short" />
      <Stack gap={2}>
        <Skeleton className="h-skeleton-line w-full" />
        <Skeleton className="h-skeleton-line w-full" />
        <Skeleton className="h-skeleton-line w-skeleton-wide" />
        <Skeleton className="h-skeleton-line w-skeleton-half" />
      </Stack>
    </Stack>
  );
}
