import { Button, Heading, Popover, PopoverContent, PopoverTrigger, Stack, Text } from "@zedtech/zedkit-ui";

export function PopoverDemo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Filters</Button>
      </PopoverTrigger>
      <PopoverContent aria-label="Filters">
        <Stack gap={2}>
          <Heading level={3}>Filters</Heading>
          <Text>Status: open invoices only.</Text>
        </Stack>
      </PopoverContent>
    </Popover>
  );
}
