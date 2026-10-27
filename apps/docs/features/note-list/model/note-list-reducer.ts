import type { Note } from "../ports/note-list-port";

export type NoteListState = {
  notes: Note[] | null;
  draft: string;
};

export const initialNoteList: NoteListState = { notes: null, draft: "" };

export type NoteListAction =
  | { type: "load-ok"; notes: Note[] }
  | { type: "draft"; value: string }
  | { type: "add-ok"; note: Note };

export function reduceNoteList(state: NoteListState, action: NoteListAction): NoteListState {
  switch (action.type) {
    case "load-ok":
      return { ...state, notes: action.notes };
    case "draft":
      return { ...state, draft: action.value };
    case "add-ok":
      return {
        notes: state.notes === null ? [action.note] : [...state.notes, action.note],
        draft: "",
      };
  }
}
