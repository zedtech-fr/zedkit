import { Input, Label, Stack, Text } from "@zedtech/zedkit-ui";

export function LabelRequiredDemo() {
  return (
    <Stack gap={4}>
      <Stack gap={2}>
        <Label htmlFor="label-email">
          Work email{" "}
          <Text as="span" aria-hidden="true" className="text-destructive">
            *
          </Text>
        </Label>
        <Input id="label-email" type="email" required placeholder="camille@example.com" />
      </Stack>
      <Stack gap={2}>
        <Label htmlFor="label-company">Company</Label>
        <Input id="label-company" placeholder="Optional" />
      </Stack>
    </Stack>
  );
}
