import type { Note } from "../ports/note-list-port";

export type NoteListState = {
  notes: Note[] | null;
  draft: string;
  loadError: boolean;
  pending: boolean;
};

export const initialNoteList: NoteListState = { notes: null, draft: "", loadError: false, pending: true };

export type NoteListAction =
  | { type: "load-start" }
  | { type: "load-ok"; notes: Note[] }
  | { type: "load-error" }
  | { type: "draft"; value: string }
  | { type: "add-start" }
  | { type: "add-ok"; note: Note }
  | { type: "add-error" };

export function reduceNoteList(state: NoteListState, action: NoteListAction): NoteListState {
  switch (action.type) {
    case "load-start":
      return { ...state, loadError: false, pending: true };
    case "load-ok":
      return { ...state, notes: action.notes, loadError: false, pending: false };
    case "load-error":
      return { ...state, loadError: true, pending: false };
    case "draft":
      return { ...state, draft: action.value };
    case "add-start":
      return { ...state, pending: true };
    case "add-ok":
      return {
        notes: state.notes === null ? [action.note] : [...state.notes, action.note],
        draft: "",
        loadError: state.loadError,
        pending: false,
      };
    case "add-error":
      return { ...state, pending: false };
  }
}
