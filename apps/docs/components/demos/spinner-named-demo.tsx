import { Spinner, Stack, Text } from "@zedtech/zedkit-ui";

export function SpinnerNamedDemo() {
  return (
    <Stack direction="horizontal" gap={2} className="items-center">
      <Spinner label="Saving invoices" />
      <Text>Saving invoices</Text>
    </Stack>
  );
}
