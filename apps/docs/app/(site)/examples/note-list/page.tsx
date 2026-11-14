import Link from "next/link";
import { Stack, Text } from "@zedtech/zedkit-ui";

import { noteListCopy } from "@/features/note-list/i18n/note-list-copy";
import { NoteListFeature } from "@/features/note-list";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const dynamic = "force-static";

export const metadata = docsPageMetadata("/examples/note-list", {
  title: noteListCopy.page.metadata.title,
  description: noteListCopy.page.metadata.description,
});

export default function NoteListExamplePage() {
  return (
    <>
      <Stack gap="sm" className="mx-auto w-full max-w-narrow px-page-gutter pt-section-sm">
        <Text variant="muted">{noteListCopy.page.intro}</Text>
        <Text variant="muted">
          {noteListCopy.page.read}{" "}
          <Link
            href="/docs/quality/enforce-feature-folder-ports-and-adapters"
            className="underline link-offset"
          >
            {noteListCopy.page.patternLink}
          </Link>
          {noteListCopy.page.patternLinkEnd}
        </Text>
      </Stack>
      <NoteListFeature />
    </>
  );
}
