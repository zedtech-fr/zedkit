import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const featureRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "..",
  "apps/docs/features/note-list",
);

async function load(rel) {
  return import(pathToFileURL(join(featureRoot, rel)).href);
}

describe("note-list example (no backend)", () => {
  it("lists seed notes and appends on add", async () => {
    const { createFixtureNoteList } = await load("adapters/fixture.ts");
    const port = createFixtureNoteList([{ id: "1", title: "Ship" }], () => "2");
    expect(await port.list()).toEqual([{ id: "1", title: "Ship" }]);
    expect(await port.add("Dock")).toEqual({ id: "2", title: "Dock" });
    expect(await port.list()).toEqual([
      { id: "1", title: "Ship" },
      { id: "2", title: "Dock" },
    ]);
  });

  it("list returns copies so callers cannot mutate the store", async () => {
    const { createFixtureNoteList } = await load("adapters/fixture.ts");
    const port = createFixtureNoteList([{ id: "1", title: "Ship" }]);
    const listed = await port.list();
    listed[0].title = "mutated";
    expect(await port.list()).toEqual([{ id: "1", title: "Ship" }]);
  });

  it("reduceNoteList loads, drafts, and appends", async () => {
    const { initialNoteList, reduceNoteList } = await load("model/note-list-reducer.ts");
    const loaded = reduceNoteList(initialNoteList, { type: "load-ok", notes: [] });
    expect(loaded.notes).toEqual([]);
    const drafted = reduceNoteList(loaded, { type: "draft", value: "Hi" });
    expect(drafted.draft).toBe("Hi");
    expect(reduceNoteList(drafted, { type: "add-ok", note: { id: "1", title: "Hi" } })).toEqual({
      notes: [{ id: "1", title: "Hi" }],
      draft: "",
    });
  });

  it("add-ok while still loading starts the list", async () => {
    const { initialNoteList, reduceNoteList } = await load("model/note-list-reducer.ts");
    const added = reduceNoteList(initialNoteList, { type: "add-ok", note: { id: "1", title: "Hi" } });
    expect(added.notes).toEqual([{ id: "1", title: "Hi" }]);
  });
});
