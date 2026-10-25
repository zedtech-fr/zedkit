import type { Metadata } from "next";
import Link from "next/link";
import { Button, Heading, Stack, Text } from "@zedtech/zedkit-ui";

import { docsPageMetadata } from "@/lib/docs-metadata";

export const metadata: Metadata = docsPageMetadata(
  "/404",
  {
    title: "Page not found",
    description: "This URL is not part of the zedkit docs site.",
  },
  { index: false },
);

export default function NotFound() {
  return (
    <Stack gap={4} className="mx-auto w-full max-w-lg px-6 py-24">
      <Heading level={1}>Page not found</Heading>
      <Text variant="muted">The page you asked for does not exist or was moved.</Text>
      <Link href="/">
        <Button>Back to zedkit</Button>
      </Link>
    </Stack>
  );
}
