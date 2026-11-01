import { Plus } from "lucide-react";
import { Button, Stack, Text } from "@zedtech/zedkit-ui";

export function ButtonDemo() {
  return (
    <Stack gap={4}>
      <Text variant="muted" className="text-xs">
        Visual variants only — buttons here do not run actions.
      </Text>
      <Stack direction="horizontal" gap={2} className="flex-wrap items-center">
        <Button>Create app</Button>
        <Button variant="secondary">Cancel</Button>
        <Button variant="outline">Details</Button>
        <Button variant="destructive">Delete</Button>
        <Button asChild variant="ghost">
          <a href="#button-demo" className="text-foreground">Docs link</a>
        </Button>
      </Stack>
      <Stack direction="horizontal" gap={2} className="flex-wrap items-center">
        <Button size="sm">Small</Button>
        <Button>Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" aria-label="Add item">
          <Plus />
        </Button>
      </Stack>
      <Stack direction="horizontal" gap={2} className="flex-wrap items-center">
        <Button disabled>Disabled</Button>
        <Button disabled>Saving…</Button>
      </Stack>
    </Stack>
  );
}
