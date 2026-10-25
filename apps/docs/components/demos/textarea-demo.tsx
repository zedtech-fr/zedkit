import { Label, Stack, Textarea } from "@zedtech/zedkit-ui";

export function TextareaDemo() {
  return (
    <Stack gap={2}>
      <Label htmlFor="demo-bio">Bio</Label>
      <Textarea id="demo-bio" placeholder="A few words." />
    </Stack>
  );
}
