import { Heading, Stack, Text } from "@zedtech/zedkit-ui";

export function TypographyDemo() {
  return (
    <Stack gap={2}>
      <Heading level={1}>Page title</Heading>
      <Heading level={2}>Section title</Heading>
      <Text>Body copy.</Text>
      <Text variant="muted">Secondary copy.</Text>
      <Heading level={2} asChild>
        <a href="#typography-as-link">Section title as a link</a>
      </Heading>
    </Stack>
  );
}
