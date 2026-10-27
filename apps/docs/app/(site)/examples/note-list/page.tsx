import { NoteListFeature } from "@/features/note-list";

import { docsPageMetadata } from "@/lib/docs-metadata";

export const dynamic = "force-static";

export const metadata = docsPageMetadata("/examples/note-list", {
  title: "Note list example",
  description: "A feature-folder example: fixture adapter, ports, pure reducer, typed copy, no backend.",
});

export default function NoteListExamplePage() {
  return <NoteListFeature />;
}
