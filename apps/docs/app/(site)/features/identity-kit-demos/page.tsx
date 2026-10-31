import { Container, Heading, Stack, Text } from "@zedtech/zedkit-ui";

import { ComponentPreview } from "@/components/component-preview";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const dynamic = "force-static";

export const metadata = docsPageMetadata("/features/identity-kit-demos", {
  title: "Identity kit demos",
  description: "Internal harness for identity component previews.",
});

export default function IdentityKitDemosPage() {
  return (
    <Container width="wide" className="py-section-lg">
      <Stack gap={8}>
        <Stack gap={2}>
          <Heading level={1}>Identity kit demos</Heading>
          <Text variant="muted">Internal previews for tests and QA. Identities are a demo concern, not a docs feature.</Text>
        </Stack>
        <ComponentPreview demo="IdentitySwitcherDemo" detail="Live switcher (demo storage key)" hasProps={false} />
        <ComponentPreview demo="IdentityScopeDemo" detail="Scoped cards" hasProps={false} />
        <ComponentPreview demo="IdentityPickerDemo" detail="Touch picker" hasProps={false} />
      </Stack>
    </Container>
  );
}
