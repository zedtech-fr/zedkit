import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { assertUniqueStems, indexSources, resolveUniqueSource } from "./resolve-ui-source.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

function fixture(files) {
  const dir = mkdtempSync(join(tmpdir(), "zk-ui-src-"));
  for (const [rel, body] of Object.entries(files)) {
    const path = join(dir, rel);
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, body);
  }
  return dir;
}

test("indexSources finds a nested unique basename and skips tests", () => {
  const root = fixture({
    "button/button.tsx": "export const Button = 1;\n",
    "button/button.test.tsx": "throw new Error('not a source');\n",
    "overlays/dialog/dialog.tsx": "export const Dialog = 1;\n",
    "index.ts": "export {};\n",
    "marketing/index.ts": "export {};\n",
  });
  const index = indexSources([root]);
  assert.equal(resolveUniqueSource(index, "button.tsx"), join(root, "button/button.tsx"));
  assert.equal(resolveUniqueSource(index, "dialog.tsx"), join(root, "overlays/dialog/dialog.tsx"));
  assert.equal(index.byFileName.has("button.test.tsx"), false);
  assert.equal((index.byFileName.get("index.ts") ?? []).length, 2);
});

test("resolveUniqueSource throws when the file is missing", () => {
  const index = indexSources([fixture({ "badge.tsx": "" })]);
  assert.throws(() => resolveUniqueSource(index, "button.tsx"), /missing: button\.tsx/);
});

test("resolveUniqueSource throws on duplicate filenames instead of taking the first", () => {
  const root = fixture({
    "a/button.tsx": "a",
    "b/button.tsx": "b",
  });
  const index = indexSources([root]);
  assert.throws(() => resolveUniqueSource(index, "button.tsx"), /ambiguous: button\.tsx/);
});

test("assertUniqueStems throws when two extensions share a stem (duplicate consumer mapping)", () => {
  const root = fixture({
    "button.ts": "a",
    "button.tsx": "b",
  });
  const index = indexSources([root]);
  assert.throws(() => assertUniqueStems(index, ["button.tsx"]), /ambiguous mapping: button/);
});

test("resolveUniqueSource throws when two trees would overwrite the same output path", () => {
  const ui = fixture({ "messages.ts": "ui" });
  const i18n = fixture({ "messages.ts": "i18n" });
  const index = indexSources([ui, i18n]);
  assert.throws(() => resolveUniqueSource(index, "messages.ts"), /ambiguous: messages\.ts/);
});

test("packages/ui/src resolves button.tsx from the button folder", () => {
  const index = indexSources([join(repoRoot, "packages/ui/src")]);
  assert.equal(
    resolveUniqueSource(index, "button.tsx"),
    join(repoRoot, "packages/ui/src/button/button.tsx"),
  );
});
