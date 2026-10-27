import { Button, Stack, StatusLabel } from "@zedtech/zedkit-ui";

export function StatusLabelOfflineDemo() {
  return (
    <Stack direction="horizontal" gap={3} className="flex-wrap items-center">
      <StatusLabel tone="offline">You are offline</StatusLabel>
      <Button size="sm" disabled>
        Sync now
      </Button>
    </Stack>
  );
}
