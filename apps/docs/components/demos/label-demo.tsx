import { Input, Label, Stack, Text } from "@zedtech/zedkit-ui";

export function LabelDemo() {
  return (
    <Stack gap={4}>
      <Stack gap={2}>
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="Ada" />
      </Stack>
      <Stack gap={2}>
        <Label htmlFor="email">
          Email <Text as="span" aria-hidden="true">*</Text>
        </Label>
        <Input id="email" required />
      </Stack>
    </Stack>
  );
}
