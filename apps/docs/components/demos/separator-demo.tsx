import { Separator, Stack, Text } from "@zedtech/zedkit-ui";

export function SeparatorDemo() {
  return (
    <Stack gap={3}>
      <Text>Above</Text>
      <Separator />
      <Text>Below</Text>
      <Stack direction="horizontal" gap={3} className="h-6">
        <Text>Left</Text>
        <Separator orientation="vertical" />
        <Text>Right</Text>
      </Stack>
    </Stack>
  );
}
