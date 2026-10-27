import { Input, Label, Stack } from "@zedtech/zedkit-ui";

export function LabelDemo() {
  return (
    <Stack gap={2}>
      <Label htmlFor="label-project">Project name</Label>
      <Input id="label-project" placeholder="Website relaunch" />
    </Stack>
  );
}
