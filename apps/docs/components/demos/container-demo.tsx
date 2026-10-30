import { Container, Section, Stack, Text } from "@zedtech/zedkit-ui";

export function ContainerDemo() {
  return (
    <Stack gap={4}>
      <Container width="narrow" className="border py-2">
        <Text>Narrow — forms and focused flows.</Text>
      </Container>
      <Container width="reading" className="border py-2">
        <Text>Reading — long-form text measure.</Text>
      </Container>
      <Container className="border py-2">
        <Text>Default — standard page shell.</Text>
      </Container>
      <Container width="wide" className="border py-2">
        <Text>Wide — landing sections on large viewports.</Text>
      </Container>
      <Section bleed tone="muted" spacing="sm" title="Bleed band" description="Background runs edge to edge; content stays capped.">
        <Text>Band content.</Text>
      </Section>
    </Stack>
  );
}
