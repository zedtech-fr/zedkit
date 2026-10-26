import { Checkmark, Stack } from "@zedtech/zedkit-ui";

export function CheckmarkDemo() {
  return (
    <Stack gap={2}>
      <Checkmark label="Saved" />
      <Checkmark />
    </Stack>
  );
}
