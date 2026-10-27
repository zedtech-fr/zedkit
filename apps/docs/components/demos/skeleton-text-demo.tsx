import { Skeleton, Stack } from "@zedtech/zedkit-ui";

export function SkeletonTextDemo() {
  return (
    <Stack gap={3} className="min-w-0" role="status" aria-label="Loading article">
      <Skeleton className="h-6 w-2/3" />
      <Stack gap={2}>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-1/2" />
      </Stack>
    </Stack>
  );
}
