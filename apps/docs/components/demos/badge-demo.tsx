import { Badge, Stack } from "@zedtech/zedkit-ui";
import { badgeCopy } from "@/components/demos/i18n/badge-copy";

export function BadgeDemo() {
  return (
    <Stack direction="horizontal" gap="sm" className="flex-wrap rounded-lg bg-card surface-pad-compact">
      <Badge>{badgeCopy.demo.beta}</Badge>
      <Badge variant="secondary">{badgeCopy.demo.events}</Badge>
      <Badge variant="outline">{badgeCopy.demo.stable}</Badge>
      <Badge variant="destructive">{badgeCopy.demo.deprecated}</Badge>
    </Stack>
  );
}
