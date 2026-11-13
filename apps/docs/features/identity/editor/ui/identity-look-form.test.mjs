import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const app = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

function read(rel) {
  return readFileSync(join(app, rel), "utf8");
}

test("Simple fields patch the preview scheme, not always light", () => {
  const form = read("features/identity/editor/ui/identity-classic-fields.tsx");
  assert.match(form, /value=\{tokens\[scheme\]\[key\]\}/);
  assert.match(form, /onPatch\(tokenKey, hsl, scheme\)/);
  assert.doesNotMatch(form, /onPatch\(tokenKey, hsl, "light"\)/);
  assert.doesNotMatch(form, /tokens\.light\[key\]/);
});

test("Classic offers every palette colour the schema has, as small pickers", () => {
  const form = read("features/identity/editor/ui/identity-classic-fields.tsx");
  const copy = read("features/identity/editor/i18n/identity-editor-copy.ts");
  for (const key of ["background", "foreground", "primary", "primaryForeground", "accent", "border", "mutedForeground"]) {
    assert.match(form, new RegExp(`"${key}"`));
  }
  assert.match(copy, /primaryForeground: "/);
  assert.match(copy, /mutedForeground: "/);
  assert.match(copy, /border: "/);
  assert.match(copy, /paletteHint:/);
  // Small swatch picker, not a full-width colour bar.
  assert.match(form, /size-control-height shrink-0 cursor-pointer/);
  assert.doesNotMatch(form, /min-w-target cursor-pointer/);
});

test("the classic (simple) mode is labelled Classic, not Simple", () => {
  const copy = read("features/identity/editor/i18n/identity-editor-copy.ts");
  assert.match(copy, /label: "Classic or expert"/);
  assert.match(copy, /simple: "Classic"/);
  assert.doesNotMatch(copy, /simple: "Simple"/);
});

test("field ids default to the editor prefix and can be re-prefixed per host", () => {
  const form = read("features/identity/editor/ui/identity-look-form.tsx");
  const classic = read("features/identity/editor/ui/identity-classic-fields.tsx");
  const fields = read("features/identity/editor/ui/identity-editor-fields.tsx");
  assert.match(form, /idPrefix = "identity-editor"/);
  assert.match(classic, /`\$\{idPrefix\}-simple-\$\{tokenKey\}`/);
  assert.match(fields, /idPrefix = "identity-editor"/);
  assert.match(fields, /`\$\{idPrefix\}-\$\{key\}`/);
});

test("Classic ChoiceSelect trigger is named with aria-label (htmlFor cannot name a Radix button)", () => {
  const form = read("features/identity/editor/ui/identity-classic-fields.tsx");
  assert.match(form, /<SelectTrigger id=\{id\} className="w-full" aria-label=\{label\}>/);
});

test("Expert color fields patch the preview scheme, not the host default", () => {
  const fields = read("features/identity/editor/ui/identity-editor-fields.tsx");
  assert.match(fields, /value=\{pair\[key\]\}/);
  assert.match(fields, /onPatch\(key, value, scheme\)/);
});

test("invalid Expert drafts show a visible FieldError, not an sr-only swatch hint", () => {
  const fields = read("features/identity/editor/ui/identity-editor-fields.tsx");
  assert.match(fields, /FieldError/);
  assert.match(fields, /fields\.invalidValue/);
  assert.match(fields, /fields\.hslFormat/);
  assert.match(fields, /data-token-swatch=/);
  assert.doesNotMatch(fields, /className="sr-only"/);
});

test("look form tabs are named and KeepBar sits after both modes", () => {
  const form = read("features/identity/editor/ui/identity-look-form.tsx");
  assert.match(form, /TabsList aria-label=\{copy\.label\}/);
  assert.match(form, /afterForm/);
  assert.doesNotMatch(form, /afterSimple/);
});

test("the editor owns Classic/Expert tabs; the dock embeds panels in the drawer header", () => {
  const form = read("features/identity/editor/ui/identity-look-form.tsx");
  assert.match(form, /tabs = "owned"/);
  assert.match(form, /tabs === "embedded"/);
  assert.match(form, /defaultMode\?: "simple" \| "expert"/);
  assert.match(form, /defaultValue=\{defaultMode \?\? "simple"\}/);
  assert.doesNotMatch(form, /stickyTabs/);
  assert.doesNotMatch(form, /sticky pin-top z-header/);
});

test("Classic groups colour, shape, type and depth; each colour row is one label", () => {
  const form = read("features/identity/editor/ui/identity-classic-fields.tsx");
  for (const section of ["ColourSection", "ShapeSection", "TypeSection", "DepthSection"]) {
    assert.match(form, new RegExp(`<${section} `));
  }
  assert.match(form, /<label\s+htmlFor=\{id\}/);
  // Multi-token choices are one edit, not two patches from the same stale draft.
  assert.match(form, /onPatchMany\(\[/);
});
