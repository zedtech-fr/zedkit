import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const app = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(app, rel), "utf8");
}

test("TOC popover trigger keeps the visible Fumadocs name", () => {
  const page = read("app/docs/[[...slug]]/page.tsx");
  const copy = read("app/i18n/docs-page-copy.ts");
  const chromeStart = page.indexOf("function docsPageChrome");
  assert.notEqual(chromeStart, -1);
  const chrome = page.slice(chromeStart, page.indexOf("export default"));
  assert.doesNotMatch(chrome, /docsPageCopy\.tableOfContents/);
  assert.doesNotMatch(chrome, /"aria-label"/);
  assert.doesNotMatch(chrome, /title:\s*docsPageCopy/);
  assert.match(chrome, /tableOfContentPopover:\s*\{\s*enabled:\s*false/);
  assert.doesNotMatch(copy, /tableOfContents/);
});
