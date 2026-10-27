import { Button, ProgressBar, Stack, Text } from "@zedtech/zedkit-ui";

export function ProgressCompleteDemo() {
  return (
    <Stack gap={3} className="min-w-0">
      <ProgressBar value={100} label="Upload complete" />
      <Stack direction="horizontal" gap={3} className="items-center">
        <Text variant="muted">october-orders.csv, 2.4 MB</Text>
        <Button size="sm" variant="outline">
          Open file
        </Button>
      </Stack>
    </Stack>
  );
}
