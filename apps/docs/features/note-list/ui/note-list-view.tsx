"use client";

import { useEffect, useReducer } from "react";
import { Button, Heading, Input, Label, Stack, Text } from "@zedtech/zedkit-ui";

import type { NoteListCopy } from "../i18n/note-list-copy";
import { initialNoteList, reduceNoteList } from "../model/note-list-reducer";
import type { NoteListPort } from "../ports/note-list-port";

export type NoteListViewProps = {
  port: NoteListPort;
  copy: NoteListCopy;
};

export function NoteListView({ port, copy }: NoteListViewProps) {
  const [state, dispatch] = useReducer(reduceNoteList, initialNoteList);

  useEffect(() => {
    let cancelled = false;
    void port.list().then((notes) => {
      if (!cancelled) dispatch({ type: "load-ok", notes });
    });
    return () => {
      cancelled = true;
    };
  }, [port]);

  const notes = state.notes;

  return (
    <Stack gap={4} className="mx-auto w-full max-w-lg px-6 py-8">
      <Heading level={1}>{copy.title}</Heading>
      {notes === null ? (
        <Text variant="muted">{copy.loading}</Text>
      ) : (
        <>
          {notes.length === 0 ? (
            <Text variant="muted">{copy.empty}</Text>
          ) : (
            <ul className="flex flex-col gap-2">
              {notes.map((note) => (
                <li key={note.id}>
                  <Text>{note.title}</Text>
                </li>
              ))}
            </ul>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const title = state.draft.trim();
              if (title.length === 0) return;
              void port.add(title).then((note) => dispatch({ type: "add-ok", note }));
            }}
          >
            <Stack gap={2}>
              <Label htmlFor="note-list-title">{copy.label}</Label>
              <Input
                id="note-list-title"
                value={state.draft}
                onChange={(event) => dispatch({ type: "draft", value: event.target.value })}
              />
              <Button type="submit">{copy.add}</Button>
            </Stack>
          </form>
        </>
      )}
    </Stack>
  );
}
