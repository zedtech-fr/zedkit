import { Separator, Stack, Text } from "@zedtech/zedkit-ui";
import { separatorCopy } from "@/components/demos/i18n/separator-copy";

export function SeparatorVerticalDemo() {
  return (
    <Stack direction="horizontal" gap={3} className="items-center">
      <Text>{separatorCopy.orders}</Text>
      <Separator orientation="vertical" />
      <Text>{separatorCopy.customers}</Text>
      <Separator orientation="vertical" />
      <Text>{separatorCopy.reports}</Text>
    </Stack>
  );
}
