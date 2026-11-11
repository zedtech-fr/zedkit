import Link from "next/link";
import { Button, Container, Heading, Stack, Text } from "@zedtech/zedkit-ui";

import { reviewsCopy } from "@/features/reviews";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const metadata = docsPageMetadata("/reviews", reviewsCopy.metadata.missing, { index: false });

export default function ReviewsNotFound() {
  return (
    <Container width="narrow" className="py-section-lg">
      <Stack gap="lg">
        <Heading level={1}>{reviewsCopy.metadata.missing.title}</Heading>
        <Text variant="muted">{reviewsCopy.pr.missing}</Text>
        <Button asChild>
          <Link href="/reviews">{reviewsCopy.pr.back}</Link>
        </Button>
      </Stack>
    </Container>
  );
}
