import { Stack, StatusDot, Text } from "@zedtech/zedkit-ui";

export function StatusDotDemo() {
  return (
    <Stack gap={2}>
      <Stack direction="horizontal" gap={2} className="items-center">
        <StatusDot tone="active" />
        <Text>Syncing…</Text>
      </Stack>
      <Stack direction="horizontal" gap={2} className="items-center">
        <StatusDot tone="idle" />
        <Text>Idle</Text>
      </Stack>
      <Stack direction="horizontal" gap={2} className="items-center">
        <StatusDot tone="success" />
        <Text>Saved</Text>
      </Stack>
      <Stack direction="horizontal" gap={2} className="items-center">
        <StatusDot tone="warning" />
        <Text>Retrying…</Text>
      </Stack>
      <Stack direction="horizontal" gap={2} className="items-center">
        <StatusDot tone="danger" />
        <Text>Failed</Text>
      </Stack>
    </Stack>
  );
}
