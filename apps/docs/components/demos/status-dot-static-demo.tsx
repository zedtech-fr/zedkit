import { Stack, StatusDot, Text } from "@zedtech/zedkit-ui";
import { statusDotCopy } from "@/components/demos/i18n/status-dot-copy";

export function StatusDotStaticDemo() {
  return (
    <Stack gap="sm">
      <Stack direction="horizontal" gap="sm" className="items-center">
        <StatusDot tone="active" />
        <Text>{statusDotCopy.live}</Text>
      </Stack>
      <Stack direction="horizontal" gap="sm" className="items-center">
        <StatusDot tone="active" pulse={false} />
        <Text>{statusDotCopy.liveStatic}</Text>
      </Stack>
    </Stack>
  );
}
