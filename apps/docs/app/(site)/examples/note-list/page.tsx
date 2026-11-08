import Link from "next/link";
import { Stack, Text } from "@zedtech/zedkit-ui";

import { noteListExampleCopy } from "@/app/i18n/note-list-example-copy";
import { NoteListFeature } from "@/features/note-list";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const dynamic = "force-static";

export const metadata = docsPageMetadata("/examples/note-list", {
  title: noteListExampleCopy.metadata.title,
  description: noteListExampleCopy.metadata.description,
});

export default function NoteListExamplePage() {
  return (
    <>
      <Stack gap="sm" className="mx-auto w-full max-w-narrow px-page-gutter pt-section-sm">
        <Text variant="muted">{noteListExampleCopy.intro}</Text>
        <Text variant="muted">
          {noteListExampleCopy.read}{" "}
          <Link
            href="/docs/quality/enforce-feature-folder-ports-and-adapters"
            className="underline link-offset"
          >
            {noteListExampleCopy.patternLink}
          </Link>
          {noteListExampleCopy.patternLinkEnd}
        </Text>
      </Stack>
      <NoteListFeature />
    </>
  );
}
