import { Stack, StatusDot, Text } from "@zedtech/zedkit-ui";

export function StatusDotStaticDemo() {
  return (
    <Stack gap={2}>
      <Stack direction="horizontal" gap={2} className="items-center">
        <StatusDot tone="active" />
        <Text>Live sync (pulses)</Text>
      </Stack>
      <Stack direction="horizontal" gap={2} className="items-center">
        <StatusDot tone="active" pulse={false} />
        <Text>Live sync, static (printed report or dense table)</Text>
      </Stack>
    </Stack>
  );
}
