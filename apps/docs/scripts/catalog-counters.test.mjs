import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  catalogCounterItems,
  catalogFilterView,
  countCatalogByArea,
} from "../lib/catalog-filter.mjs";
import { catalogCopy } from "../ui/catalog/i18n/catalog-copy.ts";

const app = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(app, rel), "utf8");
}

const COUNTER_LABELS = catalogCopy.counters.labels;

test("counter labels are UI, Core, SEO, Agents — not Core & server", () => {
  assert.deepEqual(Object.values(COUNTER_LABELS), ["UI", "Core", "SEO", "Agents"]);
  assert.equal(Object.values(COUNTER_LABELS).includes("Core & server"), false);
  const card = read("ui/catalog/catalog-counters.tsx");
  assert.match(card, /catalogCopy\.counters\.labels/);
  assert.doesNotMatch(card, /Core & server/);
});

test("catalogCounterItems uses the passed counts, fills 0, and drops extra keys", () => {
  const items = catalogCounterItems(
    { ui: 74, seo: 0, leftover: 68, mystery: 53 },
    COUNTER_LABELS,
  );
  assert.deepEqual(
    items.map((item) => [item.id, item.label, item.count]),
    [
      ["ui", "UI", 74],
      ["backend", "Core", 0],
      ["seo", "SEO", 0],
      ["agents", "Agents", 0],
    ],
  );
});

test("an empty index yields four zeros from countCatalogByArea", () => {
  const items = catalogCounterItems(countCatalogByArea([]), COUNTER_LABELS);
  assert.deepEqual(
    items.map((item) => item.count),
    [0, 0, 0, 0],
  );
});

test("card totals come from countsByArea, not mockup integers or catalogStats", () => {
  const card = read("ui/catalog/catalog-counters.tsx");
  const view = read("ui/catalog/catalog-view.tsx");
  const filter = read("lib/catalog-filter.mjs");
  const page = read("app/(site)/catalog/page.tsx");
  assert.match(card, /catalogCounterItems/);
  assert.match(view, /countsByArea/);
  assert.match(view, /<CatalogCounters/);
  assert.match(filter, /countCatalogByArea/);
  assert.doesNotMatch(card, /\b68\b/);
  assert.doesNotMatch(card, /\b53\b/);
  assert.doesNotMatch(view, /\b68\b/);
  assert.doesNotMatch(view, /catalogStats/);
  assert.doesNotMatch(card, /catalogStats/);
  assert.doesNotMatch(page, /catalogStats/);
  assert.doesNotMatch(page, /data-catalog-counters/);
});

test("filters do not shrink the four card totals", () => {
  const rows = [
    { href: "/a", title: "A", need: "A", status: "stable", area: "ui", package: "ui" },
    { href: "/b", title: "B", need: "B", status: "beta", area: "backend", package: "core" },
  ];
  const { countsByArea } = catalogFilterView(rows, { area: "ui", status: "stable", q: "A" });
  const items = catalogCounterItems(countsByArea, COUNTER_LABELS);
  assert.equal(items[0].count, 1);
  assert.equal(items[1].count, 1);
});

test("the view wraps title and card; CSS owns 1440 beside / 390 stacked", () => {
  const view = read("ui/catalog/catalog-view.tsx");
  const card = read("ui/catalog/catalog-counters.tsx");
  const css = read("app/catalog-shell.css");
  assert.match(view, /data-catalog-intro/);
  assert.match(card, /data-catalog-counters/);
  assert.match(card, /data-catalog-counters-panel/);
  assert.match(card, /grid-quad/);
  assert.match(card, /variant="glass"/);
  assert.match(card, /text-stat/);
  assert.match(css, /\[data-catalog-intro\]/);
  assert.match(css, /repeat\(auto-fit,\s*minmax\(20rem,\s*1fr\)\)/);
  assert.match(css, /\[data-catalog-counters\]/);
  assert.match(css, /--zk-preview-stage-fill/);
  assert.match(css, /prefers-reduced-transparency:\s*reduce/);
  assert.doesNotMatch(css, /font-size\s*:/);
});
