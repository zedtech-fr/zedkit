import { Heading, Stack, Text } from "@zedtech/zedkit-ui";

export function HeadingLinkDemo() {
  return (
    <Stack gap={1} className="min-w-0">
      <Text variant="muted">Release notes</Text>
      <Heading level={2} asChild>
        <a href="#section">Section title as a link</a>
      </Heading>
      <Text variant="muted">Opens the section, keeps the heading style and the heading outline.</Text>
    </Stack>
  );
}
