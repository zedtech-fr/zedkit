import { Input, Label, Stack, Text } from "@zedtech/zedkit-ui";
import { inputCopy } from "@/components/demos/i18n/input-copy";

export function InputDemo() {
  return (
    <Stack gap="lg" className="content-shrink">
      <Stack gap="sm">
        <Label htmlFor="demo-name">{inputCopy.name}</Label>
        <Input id="demo-name" autoComplete="name" defaultValue={inputCopy.nameValue} />
      </Stack>
      <Stack gap="sm">
        <Label htmlFor="demo-email">{inputCopy.email}</Label>
        <Input id="demo-email" type="email" autoComplete="email" placeholder={inputCopy.emailPlaceholder} />
        <Text variant="muted" className="text-caption">
          {inputCopy.emailHint}
        </Text>
      </Stack>
      <Stack gap="sm">
        <Label htmlFor="demo-company">{inputCopy.company}</Label>
        <Input id="demo-company" disabled defaultValue={inputCopy.companyValue} />
      </Stack>
    </Stack>
  );
}
