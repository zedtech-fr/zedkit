import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const app = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(rel.startsWith("packages/") ? root : app, rel), "utf8");
}

test("docs shell drops the page radial on every site route", () => {
  const css = read("app/docs-shell-tokens.css");
  assert.match(css, /html\[data-docs-shell\]/);
  assert.match(css, /background-image:\s*none/);
  assert.doesNotMatch(css, /body:has\(#nd-docs-layout\)/);
  assert.doesNotMatch(css, /body:has\(\[data-catalog-shell\]\)/);
});

test("docs shell pins white page fill, 1200px measure, and 24px gutter", () => {
  const css = read("app/docs-shell-tokens.css");
  assert.match(css, /--zk-site-page:\s*0 0% 100%/);
  assert.match(css, /--zk-container-default:\s*75rem/);
  assert.match(css, /--zk-container-wide:\s*75rem/);
  assert.match(css, /--zk-page-gutter:\s*1\.5rem/);
  assert.doesNotMatch(css, /--zk-container-default:\s*72\.5rem/);
});

test("docs shell display and section type match the mockup", () => {
  const css = read("app/docs-typography.css");
  assert.match(css, /--zk-type-h1-size:\s*3rem/);
  assert.match(css, /--zk-type-h1-weight:\s*500/);
  assert.match(css, /--zk-type-h2-size:\s*1\.875rem/);
  assert.match(css, /--zk-type-h2-weight:\s*500/);
  assert.match(css, /max-width:\s*390px/);
  assert.match(css, /font-family:\s*var\(--zk-font-sans\)/);
  assert.match(css, /:not\(\[data-identity-scope\] \*\)/);
});

test("site-action class pins stock near-black primary", () => {
  const css = `${read("app/docs-shell-tokens.css")}\n${read("app/site-compact.css")}`;
  assert.match(css, /\.site-action/);
  assert.match(css, /240 5\.9% 10%/);
  assert.match(css, /:not\(\.site-action\)/);
});

test("Glass identity tokens stay on the kit sheet", () => {
  const glass = read("packages/ui/src/identities/glass.css");
  assert.match(glass, /--zk-bg-pattern:/);
  assert.match(glass, /--zk-font-display:\s*"Space Grotesk Variable"/);
});

test("docs shell pins yield for a custom identity so Classic edits can paint the site", () => {
  const css = read("app/docs-shell-tokens.css");
  assert.match(css, /html\[data-docs-shell\]:not\(\.dark\):not\(\[data-identity="custom"\]\) body/);
  assert.match(css, /html\[data-docs-shell\]:not\(\.dark\):not\(\[data-identity="custom"\]\) \{/);
  assert.match(css, /:root\[data-identity\]:not\(\[data-identity="custom"\]\) \{/);
  assert.match(css, /html\[data-docs-shell\]\[data-identity="custom"\] body/);
  assert.match(css, /background-image:\s*none/);
  assert.match(css, /background-color:\s*hsl\(var\(--background\)\)/);
  assert.doesNotMatch(css, /html\[data-docs-shell\]:not\(\.dark\) body \{/);
  assert.doesNotMatch(css, /html\[data-docs-shell\]:not\(\.dark\) \{/);
  assert.doesNotMatch(css, /:root\[data-identity\] \{/);
});
