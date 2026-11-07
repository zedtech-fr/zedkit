import { Container, Section, Stack, Text } from "@zedtech/zedkit-ui";
import { containerCopy } from "@/components/demos/i18n/container-copy";

export function ContainerDemo() {
  return (
    <Stack gap={4}>
      <Container width="narrow" className="border surface-pad-block-sm">
        <Text>{containerCopy.narrow}</Text>
      </Container>
      <Container width="reading" className="border surface-pad-block-sm">
        <Text>{containerCopy.reading}</Text>
      </Container>
      <Container className="border surface-pad-block-sm">
        <Text>{containerCopy.default}</Text>
      </Container>
      <Container width="wide" className="border surface-pad-block-sm">
        <Text>{containerCopy.wide}</Text>
      </Container>
      <Section bleed tone="muted" spacing="sm" title={containerCopy.bleedTitle} description={containerCopy.bleedDescription}>
        <Text>{containerCopy.bandContent}</Text>
      </Section>
    </Stack>
  );
}
