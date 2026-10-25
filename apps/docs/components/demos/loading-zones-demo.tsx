import {
  CardSkeleton,
  DataTableSkeleton,
  DetailPanelSkeleton,
  PageHeaderSkeleton,
  Stack,
} from "@zedtech/zedkit-ui";

export function LoadingZonesDemo() {
  return (
    <Stack gap={4}>
      <PageHeaderSkeleton label="Loading page" />
      <CardSkeleton label="Loading card" />
      <DetailPanelSkeleton label="Loading details" rows={2} />
      <DataTableSkeleton label="Loading table" columns={3} rows={2} />
    </Stack>
  );
}
