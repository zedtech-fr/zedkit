import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

/** Opening raw layout/control tags, including a tag split across lines. */
const RAW_LAYOUT_TAG = /<(div|span|button)(\s|\/|>|$)/;

function hasRawLayoutTag(source) {
  return RAW_LAYOUT_TAG.test(source);
}

const app = join(dirname(fileURLToPath(import.meta.url)), "..");

const LISTED = [
  "components/component-preview.tsx",
  "ui/catalog/catalog-results.tsx",
  "ui/catalog/catalog-filters.tsx",
  "ui/catalog/catalog-counters.tsx",
  "components/preview-viewport.tsx",
];

test("a multiline opening <div is a leftover", () => {
  assert.equal(hasRawLayoutTag("<div\n  className=\"w-full\">"), true);
});

test("a native <span> is a leftover", () => {
  assert.equal(hasRawLayoutTag('<span role="status">'), true);
});

test("a native <button is a leftover", () => {
  assert.equal(hasRawLayoutTag("<button\n  type=\"button\">"), true);
});

test("kit Button type=button is not a leftover", () => {
  assert.equal(hasRawLayoutTag('<Button type="button">'), false);
});

test("kit Text as=span is not a leftover", () => {
  assert.equal(hasRawLayoutTag('<Text as="span">'), false);
});

test("closing </div> is not a leftover", () => {
  assert.equal(hasRawLayoutTag("</div>"), false);
});

test("listed files have no leftover raw layout tags", () => {
  const offenders = LISTED.filter((rel) => hasRawLayoutTag(readFileSync(join(app, rel), "utf8")));
  assert.deepEqual(offenders, []);
});
