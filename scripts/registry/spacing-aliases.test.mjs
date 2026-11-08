import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

// Two honest checks only. Distinct purposes may share a value — there
// is no canonical-value grouping any more (equal values are not a
// defect). What stays: a token must not be defined twice, and sources
// must not use the deprecated rem alias classes.

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const css = readFileSync(join(root, "packages/ui/src/styles.css"), "utf8");

test("no --spacing-* token is defined twice in styles.css", () => {
  const found = new Map();
  for (const match of css.matchAll(/^\s*(--spacing-[a-z0-9-]+):\s*([^;]+);/gm)) {
    assert.ok(!found.has(match[1]), `styles.css defines ${match[1]} twice`);
    found.set(match[1], match[2].trim());
  }
  assert.ok(found.size > 0);
});

const DEPRECATED_1REM_CLASSES = [
  "gap-dialog-gap",
  "h-data-table-skeleton-height",
  "p-dialog-gap",
  "px-button-inline",
  "right-overlay-close-offset",
  "size-icon-control",
  "size-switch-thumb",
  "top-overlay-close-offset",
  "translate-x-switch-travel",
  "h-switch-track-height",
  "space-x-dialog-footer-gap",
];

function walkJs(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "out" || entry.name === "dist") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walkJs(path, acc);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) acc.push(path);
  }
  return acc;
}

test("kit and docs sources do not use deprecated rem spacing aliases", () => {
  const files = [...walkJs(join(root, "packages/ui/src")), ...walkJs(join(root, "apps/docs"))];
  const hits = [];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const alias of DEPRECATED_1REM_CLASSES) {
      if (new RegExp(`(?<![A-Za-z0-9-])${alias}(?![A-Za-z0-9-])`).test(text)) {
        hits.push(`${relative(root, file)}: ${alias}`);
      }
    }
  }
  assert.deepEqual(hits, []);
});
