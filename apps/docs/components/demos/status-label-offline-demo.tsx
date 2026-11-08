import { Button, Stack, StatusLabel } from "@zedtech/zedkit-ui";
import { statusLabelCopy } from "@/components/demos/i18n/status-label-copy";

export function StatusLabelOfflineDemo() {
  return (
    <Stack direction="horizontal" gap="md" className="flex-wrap items-center">
      <StatusLabel tone="offline">{statusLabelCopy.offline}</StatusLabel>
      <Button size="sm" disabled>
        {statusLabelCopy.sync}
      </Button>
    </Stack>
  );
}
