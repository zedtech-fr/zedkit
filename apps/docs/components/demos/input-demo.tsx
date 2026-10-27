import { Input, Label, Stack, Text } from "@zedtech/zedkit-ui";

export function InputDemo() {
  return (
    <Stack gap={4} className="min-w-0">
      <Stack gap={2}>
        <Label htmlFor="demo-name">Full name</Label>
        <Input id="demo-name" autoComplete="name" defaultValue="Camille Rousseau" />
      </Stack>
      <Stack gap={2}>
        <Label htmlFor="demo-email">Email address</Label>
        <Input id="demo-email" type="email" autoComplete="email" placeholder="camille@example.com" />
        <Text variant="muted" className="text-xs">
          We only use it to send the order receipt.
        </Text>
      </Stack>
      <Stack gap={2}>
        <Label htmlFor="demo-company">Company</Label>
        <Input id="demo-company" disabled defaultValue="Harbor Studio" />
      </Stack>
    </Stack>
  );
}
