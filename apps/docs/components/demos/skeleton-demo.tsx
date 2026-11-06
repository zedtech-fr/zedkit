import { Skeleton, Stack } from "@zedtech/zedkit-ui";

export function SkeletonDemo() {
  return (
    <Stack gap={2}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </Stack>
  );
}
