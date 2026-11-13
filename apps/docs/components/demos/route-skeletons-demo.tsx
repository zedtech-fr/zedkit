import {
  DetailPageSkeleton,
  DocsPageSkeleton,
  ListPageSkeleton,
  Stack,
} from "@zedtech/zedkit-ui";
import { routeSkeletonsCopy } from "@/components/demos/i18n/route-skeletons-copy";

export function RouteSkeletonsDemo() {
  return (
    <Stack gap="lg">
      <DocsPageSkeleton label={routeSkeletonsCopy.docs} />
      <ListPageSkeleton label={routeSkeletonsCopy.list} cards={2} />
      <DetailPageSkeleton label={routeSkeletonsCopy.detail} rows={2} />
    </Stack>
  );
}
