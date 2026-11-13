import { Badge, Stack, Text } from "@zedtech/zedkit-ui";
import { badgeCopy } from "@/components/demos/i18n/badge-copy";

export function BadgeLinkDemo() {
  return (
    <Stack direction="horizontal" gap="sm" className="flex-wrap items-center">
      <Text>{badgeCopy.link.platform}</Text>
      <Badge asChild variant="secondary">
        <a href="#status" id="status">{badgeCopy.link.status}</a>
      </Badge>
    </Stack>
  );
}
