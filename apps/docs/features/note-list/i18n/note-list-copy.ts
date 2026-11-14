export const noteListCopy = {
  title: "Notes",
  loading: "Loading notes",
  loadError: "Notes failed to load.",
  retry: "Retry",
  empty: "No notes yet. Add one to try the fixture adapter.",
  label: "Title",
  add: "Add note",
  page: {
    metadata: {
      title: "Note list example",
      description:
        "A feature-folder example: fixture adapter, ports, pure reducer, typed copy, no backend.",
    },
    intro:
      "A runnable feature-folder example: a fixture adapter behind a port, a pure reducer, and typed copy — no backend. Add a note to try it.",
    read: "Read",
    patternLink: "how the pattern is enforced",
    patternLinkEnd: ".",
  },
} as const;

export type NoteListCopy = typeof noteListCopy;
