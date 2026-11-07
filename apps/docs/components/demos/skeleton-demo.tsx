import { Skeleton, Stack } from "@zedtech/zedkit-ui";

export function SkeletonDemo() {
  return (
    <Stack gap={2}>
      <Skeleton className="h-skeleton-line w-24" />
      <Skeleton className="h-skeleton-line w-full" />
      <Skeleton className="h-skeleton-line w-2/3" />
    </Stack>
  );
}
