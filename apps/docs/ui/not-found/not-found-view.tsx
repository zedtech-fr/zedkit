import Link from "next/link";
import { Button, Heading, Stack, Text } from "@zedtech/zedkit-ui";

export function NotFoundView() {
  return (
    <Stack gap={4} className="mx-auto w-full max-w-lg px-6 py-24">
      <Heading level={1}>Page not found</Heading>
      <Text variant="muted">The page you asked for does not exist or was moved.</Text>
      <Stack direction="horizontal" gap={3} className="flex-wrap items-center">
        <Button asChild className="w-fit">
          <Link href="/">Back to zedkit</Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/docs">Search documentation</Link>
        </Button>
      </Stack>
    </Stack>
  );
}
