import { Separator, Stack, Text } from "@zedtech/zedkit-ui";
import { separatorCopy } from "@/components/demos/i18n/separator-copy";

export function SeparatorDemo() {
  return (
    <Stack gap="md">
      <Text>{separatorCopy.above}</Text>
      <Separator />
      <Text>{separatorCopy.below}</Text>
      <Stack direction="horizontal" gap="md" className="items-center">
        <Text>{separatorCopy.left}</Text>
        <Separator orientation="vertical" />
        <Text>{separatorCopy.right}</Text>
      </Stack>
    </Stack>
  );
}
