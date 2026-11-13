import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, "..");
const ROOT = join(APP, "..", "..");

// After the copy-extraction tickets merge, add check-copy.mjs as a failing
// catalog:check gate (JSX text and visible-attribute literals outside catalogs).

const COPY_FILE_RELATIVE = [
  "components/i18n/adoption-copy.ts",
  "components/i18n/identity-assistant-copy.ts",
  "components/i18n/identity-editor-copy.ts",
  "app/i18n/identity-editor-copy.ts",
  "components/demos/i18n/brand-logo-copy.ts",
  "components/demos/i18n/scroll-scenes-copy.ts",
  "features/identity/ui/identity-editor-fields.tsx",
  "features/identity/ui/identity-editor-search.ts",
  "lib/maturity-status.ts",
];

const BRITISH_SPELLINGS = ["colour", "colours", "Colour", "Colours", "organisation", "organised", "behaviour", "behavioural"];

function walk(dir, include, relBase = "") {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "out") continue;
    const rel = relBase ? `${relBase}/${entry.name}` : entry.name;
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(abs, include, rel));
    else if (include(rel)) out.push({ abs, rel });
  }
  return out;
}

function spellingFiles() {
  const byAbs = new Map();
  function add(abs, rel) {
    byAbs.set(abs, rel);
  }
  for (const rel of COPY_FILE_RELATIVE) {
    add(join(APP, rel), rel);
  }
  for (const file of walk(APP, (name) => name.endsWith("-copy.ts"))) {
    add(file.abs, file.rel);
  }
  for (const file of walk(join(ROOT, "packages"), (name) => name.endsWith("messages.ts"))) {
    add(file.abs, `packages/${file.rel}`);
  }
  add(join(APP, "lib/site-links.mjs"), "lib/site-links.mjs");
  for (const file of walk(join(APP, "prose/guides"), (name) => name.endsWith(".mdx") && !name.includes("snippets/"))) {
    add(file.abs, `prose/guides/${file.rel}`);
  }
  add(
    join(ROOT, "packages/ui/src/identity/identity-data.ts"),
    "packages/ui/src/identity/identity-data.ts",
  );

  const missing = [...byAbs.entries()].filter(([abs]) => !existsSync(abs)).map(([, rel]) => rel);
  assert.deepEqual(missing, [], `listed copy files missing:\n${missing.join("\n")}`);
  return [...byAbs.entries()].map(([abs, rel]) => ({ rel, content: readFileSync(abs, "utf8") }));
}

test("spelling walk covers catalogs, footer links, guides, and identity copy", () => {
  const rels = spellingFiles().map((file) => file.rel);
  assert.ok(rels.some((rel) => rel.endsWith("-copy.ts")));
  assert.ok(rels.includes("lib/site-links.mjs"));
  assert.ok(rels.some((rel) => rel.startsWith("prose/guides/") && rel.endsWith(".mdx")));
  assert.ok(rels.some((rel) => rel.endsWith("specimens-messages.ts")));
  assert.ok(rels.includes("packages/ui/src/identity/identity-data.ts"));
  for (const rel of COPY_FILE_RELATIVE) {
    assert.ok(rels.includes(rel), `walk dropped ${rel}`);
  }
});

test("listed copy files use US spelling for color and organisation", () => {
  const errors = [];
  for (const { rel, content } of spellingFiles()) {
    for (const word of BRITISH_SPELLINGS) {
      if (content.includes(word)) {
        errors.push(`${rel} contains British spelling "${word}"`);
      }
    }
  }
  assert.deepEqual(errors, [], `British spellings found:\n${errors.join("\n")}`);
});
