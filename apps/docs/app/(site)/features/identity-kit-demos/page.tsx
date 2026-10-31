import Link from "next/link";
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
        <ComponentPreview demo="IdentitySwitcherDemo" hasProps={false} />
        <ComponentPreview demo="IdentityScopeDemo" hasProps={false} />
        <ComponentPreview demo="IdentityPickerDemo" hasProps={false} />
        <Text variant="muted" className="text-sm">
          <Link href="/docs/ui/pin-a-stage-and-change-scene-as-the-page-scrolls" className="text-primary underline-offset-4 hover:underline">
            Open the scroll scenes guide
          </Link>{" "}
          to leave this harness.
        </Text>
      </Stack>
    </Container>
  );
}
