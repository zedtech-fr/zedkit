import { Label, SecretField, Stack } from "@zedtech/zedkit-ui";

export function SecretFieldDemo() {
  return (
    <Stack gap={4}>
      <Stack gap={2}>
        <Label htmlFor="demo-key">API key (shown once)</Label>
        <SecretField id="demo-key" value="zk_live_49f2c1" />
      </Stack>
      <Stack gap={2}>
        <Label htmlFor="demo-command">Install command (multiline)</Label>
        <SecretField
          multiline
          id="demo-command"
          value="pnpm dlx shadcn@latest add https://zedkit.app/r/themes/volt.json"
          copyLabel="Copy install command"
        />
      </Stack>
    </Stack>
  );
}
