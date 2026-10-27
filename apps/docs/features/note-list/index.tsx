"use client";

import { createFixtureNoteList } from "./adapters/fixture";
import { noteListCopy } from "./i18n/note-list-copy";
import { NoteListView } from "./ui/note-list-view";

const port = createFixtureNoteList();

export function NoteListFeature() {
  return <NoteListView port={port} copy={noteListCopy} />;
}
