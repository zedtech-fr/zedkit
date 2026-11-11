import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const app = join(dirname(fileURLToPath(import.meta.url)), "..");
const { catalogCopy } = await import("../ui/catalog/i18n/catalog-copy.ts");

const SEARCH_FIRST_LEAD =
  "Search by need. Filter by area or maturity if you want — share or reload keeps the URL.";

test("catalog lead tells the visitor to search by need", () => {
  assert.equal(catalogCopy.header.lead, SEARCH_FIRST_LEAD);
  assert.equal(catalogCopy.header.lead.startsWith("Filter"), false);
  assert.doesNotMatch(catalogCopy.header.lead, /\d/);
  assert.equal("counters" in catalogCopy, false);
});

test("catalog search placeholder puts need before title", () => {
  assert.equal(catalogCopy.filters.searchPlaceholder, "Need or title");
});

test("catalog identity group name is one line and not a showcase", () => {
  assert.equal(catalogCopy.identity.groupLabel, "Try a look");
  assert.doesNotMatch(catalogCopy.identity.groupLabel, /\d/);
  assert.doesNotMatch(catalogCopy.identity.groupLabel, /showcase/i);
});

test("results status line takes a count argument", () => {
  assert.equal(catalogCopy.results.statusLine(0), "0 entries");
  assert.equal(catalogCopy.results.statusLine(1), "1 entry");
  assert.equal(catalogCopy.results.statusLine(2), "2 entries");
});

test("catalog UI has no counters module", () => {
  const names = readdirSync(join(app, "ui/catalog"), { recursive: true }).map(String);
  assert.equal(
    names.filter((name) => /counter/i.test(name)).length,
    0,
  );
});

test("catalog view keeps the quiet filtered count and the copy lead", () => {
  const view = readFileSync(join(app, "ui/catalog/catalog-view.tsx"), "utf8");
  const page = readFileSync(join(app, "app/(site)/catalog/page.tsx"), "utf8");
  assert.match(view, /\{catalogCopy\.header\.lead\}/);
  assert.match(view, /catalogResultsStatusLine\(filtered\.length\)/);
  assert.match(page, /entries=\{catalogIndex\}/);
  assert.doesNotMatch(view, /catalogStats/);
  assert.doesNotMatch(page, /catalogStats/);
  assert.doesNotMatch(view, /data-catalog-counters/);
  assert.doesNotMatch(page, /data-catalog-counters/);
});
