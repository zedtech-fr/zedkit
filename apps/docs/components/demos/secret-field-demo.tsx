import { Label, SecretField, Stack } from "@zedtech/zedkit-ui";

export function SecretFieldDemo() {
  return (
    <Stack gap={2}>
      <Label htmlFor="demo-key">API key (shown once)</Label>
      <SecretField id="demo-key" value="zk_live_49f2c1" />
    </Stack>
  );
}
