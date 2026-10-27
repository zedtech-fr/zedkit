import { Separator, Stack, Text } from "@zedtech/zedkit-ui";

export function SeparatorVerticalDemo() {
  return (
    <Stack direction="horizontal" gap={3} className="h-6 items-center">
      <Text>Orders</Text>
      <Separator orientation="vertical" className="h-6" />
      <Text>Customers</Text>
      <Separator orientation="vertical" className="h-6" />
      <Text>Reports</Text>
    </Stack>
  );
}
