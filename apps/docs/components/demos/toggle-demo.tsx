import { Checkbox, Label, Stack, Switch, Text } from "@zedtech/zedkit-ui";

export function ToggleDemo() {
  return (
    <Stack gap={4}>
      <Stack direction="horizontal" gap={2} className="items-center">
        <Checkbox id="demo-terms" />
        <Label htmlFor="demo-terms">I accept the terms of sale</Label>
      </Stack>
      <Stack gap={1}>
        <Stack direction="horizontal" gap={2} className="items-center">
          <Switch id="demo-notify" defaultChecked />
          <Label htmlFor="demo-notify">Notify me when the order ships</Label>
        </Stack>
        <Text variant="muted" className="text-xs">
          One email with the tracking link.
        </Text>
      </Stack>
    </Stack>
  );
}
