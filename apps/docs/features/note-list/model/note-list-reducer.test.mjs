import assert from "node:assert/strict";
import test from "node:test";

import { initialNoteList, reduceNoteList } from "./note-list-reducer.ts";

test("initial state starts pending with no notes and no error", () => {
  assert.deepEqual(initialNoteList, { notes: null, draft: "", loadError: false, pending: true });
});

test("load-error records the failure and clears pending", () => {
  const state = reduceNoteList(initialNoteList, { type: "load-error" });
  assert.deepEqual(state, { notes: null, draft: "", loadError: true, pending: false });
});

test("load-start clears a previous error for retry", () => {
  const failed = reduceNoteList(initialNoteList, { type: "load-error" });
  const retrying = reduceNoteList(failed, { type: "load-start" });
  assert.deepEqual(retrying, { notes: null, draft: "", loadError: false, pending: true });
});

test("load-ok clears error and pending and stores the notes", () => {
  const notes = [{ id: "n1", title: "First" }];
  const failed = reduceNoteList(initialNoteList, { type: "load-error" });
  const retried = reduceNoteList(failed, { type: "load-start" });
  const loaded = reduceNoteList(retried, { type: "load-ok", notes });
  assert.deepEqual(loaded, { notes, draft: "", loadError: false, pending: false });
});

test("draft updates the draft and nothing else", () => {
  const state = reduceNoteList(initialNoteList, { type: "draft", value: "  Hello  " });
  assert.equal(state.draft, "  Hello  ");
  assert.equal(state.notes, null);
  assert.equal(state.pending, true);
});

test("add-ok appends, clears the draft, and clears pending", () => {
  const first = reduceNoteList(initialNoteList, { type: "load-ok", notes: [{ id: "n1", title: "First" }] });
  const typed = reduceNoteList(first, { type: "draft", value: "Second" });
  const adding = reduceNoteList(typed, { type: "add-start" });
  assert.equal(adding.pending, true);
  const added = reduceNoteList(adding, { type: "add-ok", note: { id: "n2", title: "Second" } });
  assert.deepEqual(added.notes, [
    { id: "n1", title: "First" },
    { id: "n2", title: "Second" },
  ]);
  assert.equal(added.draft, "");
  assert.equal(added.pending, false);
});

test("add-ok seeds the list when notes were never loaded", () => {
  const added = reduceNoteList(initialNoteList, { type: "add-ok", note: { id: "n1", title: "First" } });
  assert.deepEqual(added.notes, [{ id: "n1", title: "First" }]);
  assert.equal(added.pending, false);
});

test("add-error clears pending and keeps the draft for resubmission", () => {
  const loaded = reduceNoteList(initialNoteList, { type: "load-ok", notes: [] });
  const typed = reduceNoteList(loaded, { type: "draft", value: "Keep me" });
  const adding = reduceNoteList(typed, { type: "add-start" });
  const failed = reduceNoteList(adding, { type: "add-error" });
  assert.equal(failed.pending, false);
  assert.equal(failed.draft, "Keep me");
  assert.deepEqual(failed.notes, []);
});
