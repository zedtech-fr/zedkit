import { Spinner, Stack, Text } from "@zedtech/zedkit-ui";

export function FourStateLoadingDemo() {
  return (
    <Stack direction="horizontal" gap={2} className="items-center">
      <Spinner label="Loading invoices" />
      <Text>Loading invoices</Text>
    </Stack>
  );
}
