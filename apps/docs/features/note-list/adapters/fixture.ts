import type { Note, NoteListPort } from "../ports/note-list-port";

export function createFixtureNoteList(seed: readonly Note[] = [], createId?: () => string): NoteListPort {
  const notes: Note[] = seed.map((note) => ({ ...note }));
  let seq = 0;
  const nextId = createId ?? (() => `note-${String(++seq)}`);
  return {
    list() {
      return Promise.resolve(notes.map((note) => ({ ...note })));
    },
    add(title: string) {
      const note = { id: nextId(), title };
      notes.push(note);
      return Promise.resolve({ ...note });
    },
  };
}
