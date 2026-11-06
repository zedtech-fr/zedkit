export type Note = {
  readonly id: string;
  readonly title: string;
};

export type NoteListPort = {
  list(): Promise<Note[]>;
  add(title: string): Promise<Note>;
};
