import Link from "next/link";
import { Container, Heading, Stack, Text } from "@zedtech/zedkit-ui";

import { identityKitDemosCopy } from "@/app/i18n/identity-kit-demos-copy";
import { ComponentPreview } from "@/features/docs/ui/component-preview";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const dynamic = "force-static";

export const metadata = docsPageMetadata("/features/identity-kit-demos", {
  title: identityKitDemosCopy.metadata.title,
  description: identityKitDemosCopy.metadata.description,
});

export default function IdentityKitDemosPage() {
  return (
    <Container width="wide" className="py-section-lg">
      <Stack gap="blocks">
        <Stack gap="sm">
          <Heading level={1}>{identityKitDemosCopy.heading}</Heading>
          <Text variant="muted">{identityKitDemosCopy.body}</Text>
        </Stack>
        <ComponentPreview demo="IdentitySwitcherDemo" hasProps={false} />
        <ComponentPreview demo="IdentityScopeDemo" hasProps={false} />
        <ComponentPreview demo="IdentityPickerDemo" hasProps={false} />
        <Text variant="muted">
          <Link href="/docs/ui/pin-a-stage-and-change-scene-as-the-page-scrolls" className="text-primary link-offset hover:underline">
            {identityKitDemosCopy.scrollGuide}
          </Link>{" "}
          {identityKitDemosCopy.afterScrollGuide}
        </Text>
      </Stack>
    </Container>
  );
}
