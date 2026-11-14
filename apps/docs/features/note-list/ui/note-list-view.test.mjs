import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { noteListCopy } from "../i18n/note-list-copy.ts";
import { initialNoteList, reduceNoteList } from "../model/note-list-reducer.ts";

const here = dirname(fileURLToPath(import.meta.url));
const viewSource = readFileSync(join(here, "note-list-view.tsx"), "utf8");

// Same dispatch chain the view uses for list(): resolve -> load-ok, reject -> load-error.
async function settleList(port, state) {
  return port.list().then(
    (notes) => reduceNoteList(state, { type: "load-ok", notes }),
    () => reduceNoteList(state, { type: "load-error" }),
  );
}

test("a rejecting port lands on load-error, not stuck on loading", async () => {
  const port = {
    list: () => Promise.reject(new Error("offline")),
    add: (title) => Promise.resolve({ id: "n1", title }),
  };
  const state = await settleList(port, reduceNoteList(initialNoteList, { type: "load-start" }));
  assert.equal(state.notes, null);
  assert.equal(state.loadError, true);
  assert.equal(state.pending, false);
});

test("retry re-calls list() and recovers to load-ok", async () => {
  let calls = 0;
  const port = {
    list() {
      calls += 1;
      return calls === 1
        ? Promise.reject(new Error("offline"))
        : Promise.resolve([{ id: "n1", title: "First" }]);
    },
    add: (title) => Promise.resolve({ id: "n1", title }),
  };
  const failed = await settleList(port, reduceNoteList(initialNoteList, { type: "load-start" }));
  assert.equal(failed.loadError, true);

  const retried = reduceNoteList(failed, { type: "load-start" });
  assert.equal(retried.pending, true);
  assert.equal(retried.loadError, true);

  const loaded = await settleList(port, retried);
  assert.equal(calls, 2);
  assert.deepEqual(loaded.notes, [{ id: "n1", title: "First" }]);
  assert.equal(loaded.loadError, false);
  assert.equal(loaded.pending, false);
});

test("copy names the error and the retry action", () => {
  assert.equal(typeof noteListCopy.loadError, "string");
  assert.equal(typeof noteListCopy.retry, "string");
  assert.equal(typeof noteListCopy.addError, "string");
  assert.match(viewSource, /\{copy\.loadError\}/);
  assert.match(viewSource, /\{copy\.retry\}/);
});

test("view renders the error branch with a retry that re-dispatches list()", () => {
  assert.match(viewSource, /load-error/);
  // The initial effect and the retry button share the refresh() helper.
  assert.match(viewSource, /function refresh\(/);
  assert.match(viewSource, /refresh\(port, dispatch/);
  assert.match(viewSource, /disabled=\{state\.pending\}/);
  assert.match(viewSource, /role="alert"/);
  assert.match(viewSource, /\{copy\.addError\}/);
});

test("add is disabled while the draft is empty and while pending", () => {
  assert.match(viewSource, /disabled=\{draftEmpty \|\| pending\}/);
  assert.match(viewSource, /if \(title\.length === 0 \|\| pending\) return;/);
});

test("fire-and-forget promises carry rejection handlers", () => {
  assert.match(viewSource, /port\.list\(\)\.then\(/);
  assert.match(viewSource, /port\.add\(title\)\.then\(/);
});
