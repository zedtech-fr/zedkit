import { Button, Stack } from "@zedtech/zedkit-ui";

export function ButtonDemo() {
  return (
    <Stack direction="horizontal" gap={2} className="flex-wrap">
      <Button>Create app</Button>
      <Button variant="secondary">Cancel</Button>
      <Button variant="outline">Details</Button>
      <Button variant="destructive">Delete</Button>
      <Button asChild variant="ghost">
        <a href="#button-demo" className="text-foreground">Docs link</a>
      </Button>
    </Stack>
  );
}
