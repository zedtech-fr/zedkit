import { Checkmark, Stack, Text } from "@zedtech/zedkit-ui";

export function CheckmarkDecorativeDemo() {
  return (
    <Stack direction="horizontal" gap={3} className="items-center">
      <Checkmark />
      <Stack gap={1}>
        <Text className="font-medium">Order #4821 confirmed</Text>
        <Text variant="muted">A receipt is on its way to camille@example.com.</Text>
      </Stack>
    </Stack>
  );
}
