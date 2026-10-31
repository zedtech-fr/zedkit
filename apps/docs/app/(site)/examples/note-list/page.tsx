import Link from "next/link";
import { Stack, Text } from "@zedtech/zedkit-ui";

import { NoteListFeature } from "@/features/note-list";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const dynamic = "force-static";

export const metadata = docsPageMetadata("/examples/note-list", {
  title: "Note list example",
  description: "A feature-folder example: fixture adapter, ports, pure reducer, typed copy, no backend.",
});

export default function NoteListExamplePage() {
  return (
    <>
      <Stack gap={2} className="mx-auto w-full max-w-lg px-6 pt-8">
        <Text variant="muted">
          A runnable feature-folder example: a fixture adapter behind a port, a pure reducer, and
          typed copy — no backend. Add a note to try it.
        </Text>
        <Text variant="muted">
          Read{" "}
          <Link
            href="/docs/quality/enforce-feature-folder-ports-and-adapters"
            className="underline underline-offset-4"
          >
            how the pattern is enforced
          </Link>
          .
        </Text>
      </Stack>
      <NoteListFeature />
    </>
  );
}
