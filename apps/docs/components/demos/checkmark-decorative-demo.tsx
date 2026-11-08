import { Checkmark, Stack, Text } from "@zedtech/zedkit-ui";
import { checkmarkCopy } from "@/components/demos/i18n/checkmark-copy";

export function CheckmarkDecorativeDemo() {
  return (
    <Stack direction="horizontal" gap="md" className="items-center">
      <Checkmark />
      <Stack gap="tight">
        <Text className="font-medium">{checkmarkCopy.decorative.title}</Text>
        <Text variant="muted">{checkmarkCopy.decorative.subtitle}</Text>
      </Stack>
    </Stack>
  );
}
