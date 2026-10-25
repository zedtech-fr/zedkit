import { Badge, Section, Stack } from "@zedtech/zedkit-ui";

export function StackDemo() {
  return (
    <Section title="Team" description="Who can access.">
      <Stack direction="horizontal" gap={2}>
        <Badge>Ada</Badge>
        <Badge variant="secondary">Bo</Badge>
      </Stack>
    </Section>
  );
}
