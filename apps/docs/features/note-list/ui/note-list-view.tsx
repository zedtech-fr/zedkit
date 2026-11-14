"use client";

import type { Dispatch } from "react";
import { useEffect, useReducer, useRef } from "react";
import { Button, Heading, Input, Label, Stack, Text } from "@zedtech/zedkit-ui";

import type { NoteListCopy } from "../i18n/note-list-copy";
import type { NoteListAction } from "../model/note-list-reducer";
import { initialNoteList, reduceNoteList } from "../model/note-list-reducer";
import type { Note, NoteListPort } from "../ports/note-list-port";

type DispatchAction = Dispatch<NoteListAction>;

export type NoteListViewProps = {
  port: NoteListPort;
  copy: NoteListCopy;
};

function refresh(port: NoteListPort, dispatch: DispatchAction, isCurrent: () => boolean): void {
  dispatch({ type: "load-start" });
  void port.list().then(
    (notes: Note[]) => {
      if (isCurrent()) dispatch({ type: "load-ok", notes });
    },
    () => {
      if (isCurrent()) dispatch({ type: "load-error" });
    },
  );
}

function addNote(port: NoteListPort, title: string, dispatch: DispatchAction, isCurrent: () => boolean): void {
  dispatch({ type: "add-start" });
  void port.add(title).then(
    (note: Note) => {
      if (isCurrent()) dispatch({ type: "add-ok", note });
    },
    () => {
      if (isCurrent()) dispatch({ type: "add-error" });
    },
  );
}

type NoteListBodyProps = {
  copy: NoteListCopy;
  port: NoteListPort;
  dispatch: DispatchAction;
  isMounted: () => boolean;
  notes: Note[];
  draft: string;
  pending: boolean;
  addError: boolean;
};

function NoteListBody({ copy, port, dispatch, isMounted, notes, draft, pending, addError }: NoteListBodyProps) {
  const draftEmpty = draft.trim().length === 0;
  return (
    <>
      {notes.length === 0 ? (
        <Text variant="muted">{copy.empty}</Text>
      ) : (
        <ul className="flex flex-col gap-stack-sm">
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
          const title = draft.trim();
          if (title.length === 0 || pending) return;
          addNote(port, title, dispatch, isMounted);
        }}
      >
        <Stack gap="sm">
          <Label htmlFor="note-list-title">{copy.label}</Label>
          <Input
            id="note-list-title"
            value={draft}
            onChange={(event) => dispatch({ type: "draft", value: event.target.value })}
          />
          {addError ? (
            <Text variant="muted" role="alert">
              {copy.addError}
            </Text>
          ) : null}
          <Button type="submit" disabled={draftEmpty || pending}>
            {copy.add}
          </Button>
        </Stack>
      </form>
    </>
  );
}

export function NoteListView({ port, copy }: NoteListViewProps) {
  const [state, dispatch] = useReducer(reduceNoteList, initialNoteList);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    refresh(port, dispatch, () => !cancelled);
    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [port]);

  const notes = state.notes;
  const isMounted = () => mountedRef.current;

  return (
    <Stack gap="lg" className="mx-auto w-full max-w-narrow px-page-gutter py-section-sm">
      <Heading level={1}>{copy.title}</Heading>
      {notes === null ? (
        state.loadError ? (
          <Stack gap="sm">
            <Text variant="muted" role="alert">
              {copy.loadError}
            </Text>
            <Button type="button" onClick={() => refresh(port, dispatch, isMounted)} disabled={state.pending}>
              {copy.retry}
            </Button>
          </Stack>
        ) : (
          <Text variant="muted">{copy.loading}</Text>
        )
      ) : (
        <NoteListBody
          copy={copy}
          port={port}
          dispatch={dispatch}
          isMounted={isMounted}
          notes={notes}
          draft={state.draft}
          pending={state.pending}
          addError={state.addError}
        />
      )}
    </Stack>
  );
}
