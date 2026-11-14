import Link from "next/link";
import { Button, Container, Heading, Stack, Text } from "@zedtech/zedkit-ui";

export function ReviewNotFoundView({
  title,
  body,
  backLabel,
}: {
  title: string;
  body: string;
  backLabel: string;
}) {
  return (
    <Container width="narrow" className="py-section-lg">
      <Stack gap="lg">
        <Heading level={1}>{title}</Heading>
        <Text variant="muted">{body}</Text>
        <Button asChild>
          <Link href="/issues">{backLabel}</Link>
        </Button>
      </Stack>
    </Container>
  );
}
