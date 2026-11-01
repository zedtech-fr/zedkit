import { Plus } from "lucide-react";
import { Button, Stack, Text } from "@zedtech/zedkit-ui";
import { buttonCopy } from "@/components/demos/i18n/button-copy";

export function ButtonDemo() {
  return (
    <Stack gap={4}>
      <Text variant="muted" className="text-xs">
        {buttonCopy.hint}
      </Text>
      <Stack direction="horizontal" gap={2} className="flex-wrap items-center">
        <Button>{buttonCopy.createApp}</Button>
        <Button variant="secondary">{buttonCopy.cancel}</Button>
        <Button variant="outline">{buttonCopy.details}</Button>
        <Button variant="destructive">{buttonCopy.delete}</Button>
        <Button asChild variant="ghost">
          <a href="#button-demo" className="text-foreground">{buttonCopy.docsLink}</a>
        </Button>
      </Stack>
      <Stack direction="horizontal" gap={2} className="flex-wrap items-center">
        <Button size="sm">{buttonCopy.small}</Button>
        <Button>{buttonCopy.default}</Button>
        <Button size="lg">{buttonCopy.large}</Button>
        <Button size="icon" aria-label={buttonCopy.addItemAriaLabel}>
          <Plus />
        </Button>
      </Stack>
      <Stack direction="horizontal" gap={2} className="flex-wrap items-center">
        <Button disabled>{buttonCopy.disabled}</Button>
        <Button disabled>{buttonCopy.saving}</Button>
      </Stack>
    </Stack>
  );
}
