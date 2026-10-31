"use client";

import Link from "next/link";
import { Button, Stack, Text } from "@zedtech/zedkit-ui";
import { DocsActionLabel } from "@/components/docs-action-label";
import { HOME_CARD_CONTENT_GAP } from "@/ui/home/home-rhythm";

export function HomeGetStartedQuickstartBlock() {
  return (
    <Stack gap={HOME_CARD_CONTENT_GAP} id="quickstart" className="scroll-mt-24">
      <Text variant="muted">
        Wire globals, install the package, and render a button — about five minutes in a fresh Next.js app.
      </Text>
      <Button asChild variant="outline" className="w-fit">
        <Link href="/docs/getting-started#quickstart">
          <DocsActionLabel>Open the full UI quickstart</DocsActionLabel>
        </Link>
      </Button>
    </Stack>
  );
}
