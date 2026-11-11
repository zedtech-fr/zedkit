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

test("catalog copy carries no inline identity form", () => {
  assert.equal("identity" in catalogCopy, false);
});

test("chip labels use a middle dot and a live count", () => {
  assert.equal(catalogCopy.filters.chipLabel("UI", 68), "UI · 68");
  assert.equal(catalogCopy.filters.chipLabel("Core & server", 53), "Core & server · 53");
});

test("results status line shows visible of area total plus the stable legend", () => {
  assert.equal(catalogCopy.results.statusLine(0, 0), "Showing 0 of 0.");
  assert.equal(catalogCopy.results.statusLine(1, 3), "Showing 1 of 3.");
  assert.equal(catalogCopy.results.statusLine(18, 68), "Showing 18 of 68.");
  assert.equal(catalogCopy.results.stableLegend, "Entries with no label are stable.");
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
  assert.match(view, /catalogResultsStatusLine\(visible\.length, areaTotal\)/);
  assert.match(page, /entries=\{catalogIndex\}/);
  assert.doesNotMatch(view, /catalogStats/);
  assert.doesNotMatch(page, /catalogStats/);
  assert.doesNotMatch(view, /data-catalog-counters/);
  assert.doesNotMatch(page, /data-catalog-counters/);
});
