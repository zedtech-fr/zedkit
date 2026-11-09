import { Checkbox, Label, Stack, Switch, Text } from "@zedtech/zedkit-ui";
import { toggleCopy } from "@/components/demos/i18n/toggle-copy";

export function ToggleDemo() {
  return (
    <Stack gap="lg">
      <Stack direction="horizontal" gap="sm" className="items-center">
        <Checkbox id="demo-terms" />
        <Label htmlFor="demo-terms">{toggleCopy.terms}</Label>
      </Stack>
      <Stack gap="tight">
        <Stack direction="horizontal" gap="sm" className="items-center">
          <Switch id="demo-notify" defaultChecked />
          <Label htmlFor="demo-notify">{toggleCopy.notify}</Label>
        </Stack>
        <Text variant="muted" className="text-caption">
          {toggleCopy.hint}
        </Text>
      </Stack>
    </Stack>
  );
}
