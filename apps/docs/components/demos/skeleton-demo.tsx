import { Skeleton, Stack } from "@zedtech/zedkit-ui";

export function SkeletonDemo() {
  return (
    <Stack gap="sm">
      <Skeleton className="h-skeleton-line w-skeleton-bar" />
      <Skeleton className="h-skeleton-line w-full" />
      <Skeleton className="h-skeleton-line w-skeleton-short" />
    </Stack>
  );
}
