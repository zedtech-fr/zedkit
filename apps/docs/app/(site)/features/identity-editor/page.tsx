import { Container, Heading, Stack, Text } from "@zedtech/zedkit-ui";

import { IdentityEditorPanel } from "@/components/identity-editor-panel";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const dynamic = "force-static";

export const metadata = docsPageMetadata("/features/identity-editor", {
  title: "Identity demo editor",
  description: "Try spacing, colour, and type tokens in the browser. Demo only — not a shipped docs feature.",
});

export default function IdentityEditorFeaturePage() {
  return (
    <Container width="wide" className="py-section-lg">
      <Stack gap={6}>
        <Stack gap={2}>
          <Heading level={1}>Try looks in the demo editor</Heading>
          <Text variant="muted">
            Tune tokens and preview them on a card. Use Apply to the whole site only when you mean to change the docs
            shell; the home hero demo uses its own scoped selector.
          </Text>
        </Stack>
        <IdentityEditorPanel />
      </Stack>
    </Container>
  );
}
