import Link from "next/link";
import { Button, Container, Heading, Stack, Text } from "@zedtech/zedkit-ui";

export function NotFoundView() {
  return (
    <Container width="narrow" className="py-section-lg">
      <Stack gap={4}>
        <Heading level={1}>Page not found</Heading>
        <Text variant="muted">The page you asked for does not exist or was moved.</Text>
        <Button asChild>
          <Link href="/">Back to zedkit</Link>
        </Button>
      </Stack>
    </Container>
  );
}
