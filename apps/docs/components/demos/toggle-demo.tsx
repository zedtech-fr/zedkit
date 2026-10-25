import { Checkbox, Label, Stack, Switch } from "@zedtech/zedkit-ui";

export function ToggleDemo() {
  return (
    <Stack gap={3}>
      <Stack direction="horizontal" gap={2}>
        <Checkbox id="demo-terms" />
        <Label htmlFor="demo-terms">Accept the terms</Label>
      </Stack>
      <Stack direction="horizontal" gap={2}>
        <Switch id="demo-notify" aria-label="Notify me" />
        <Label htmlFor="demo-notify">Notify me</Label>
      </Stack>
    </Stack>
  );
}
