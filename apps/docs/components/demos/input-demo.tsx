import { Input, Label, Stack } from "@zedtech/zedkit-ui";

export function InputDemo() {
  return (
    <Stack gap={2}>
      <Label htmlFor="demo-name">Name</Label>
      <Input id="demo-name" placeholder="Ada" />
    </Stack>
  );
}
