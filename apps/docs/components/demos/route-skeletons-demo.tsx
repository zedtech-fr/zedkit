import {
  DetailPageSkeleton,
  DocsPageSkeleton,
  ListPageSkeleton,
  Stack,
} from "@zedtech/zedkit-ui";
import { routeSkeletonsCopy } from "@/components/demos/i18n/route-skeletons-copy";

/**
 * Métier: public TypeScript kit; docs site is the reading surface.
 * Client personas: maintainers copying a layout pattern (assumed: they want a default).
 * Customers: developers visiting zedkit.app to read a need.
 * Customer personas: hurried, often on a laptop; the wait must look like the page that lands.
 * UI: docs/list/detail waits as composed zones, because: customer = reading, not watching a spinner.
 */
export function RouteSkeletonsDemo() {
  return (
    <Stack gap="lg">
      <DocsPageSkeleton label={routeSkeletonsCopy.docs} />
      <ListPageSkeleton label={routeSkeletonsCopy.list} cards={2} />
      <DetailPageSkeleton label={routeSkeletonsCopy.detail} rows={2} />
    </Stack>
  );
}
