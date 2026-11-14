import assert from "node:assert/strict";
import test from "node:test";
import {
  CATALOG_AREAS,
  CATALOG_DEFAULT_FILTERS,
  catalogCounterItems,
  catalogFilterSearchParams,
  catalogFilterView,
  countCatalogByArea,
  filterCatalogEntries,
  parseCatalogArea,
  readCatalogFilters,
} from "./catalog-filter.mjs";

/** @param {Partial<import("@/content/catalog-index").CatalogIndexEntry> & { title: string }} overrides */
const row = (overrides) => ({
  href: `/docs/${overrides.package ?? "ui"}/${overrides.title}`,
  need: overrides.need ?? overrides.title,
  status: "stable",
  area: "ui",
  package: "ui",
  ...overrides,
});

const MIXED = [
  row({ title: "Alert", area: "ui", status: "stable" }),
  row({ title: "Animate", area: "ui", status: "alpha" }),
  row({ title: "Button", area: "ui", status: "beta" }),
  row({ title: "tryCatch", area: "backend", status: "stable", package: "core" }),
  row({ title: "JsonLd", area: "seo", status: "stable", package: "seo" }),
  row({ title: "setup-ai", area: "agents", status: "beta", package: "ai" }),
];

test("CATALOG_AREAS is the four known chip ids with catalog area labels", () => {
  assert.deepEqual(
    CATALOG_AREAS.map((area) => [area.id, area.label]),
    [
      ["ui", "UI"],
      ["backend", "Core and server"],
      ["seo", "SEO"],
      ["agents", "Agents"],
    ],
  );
});

test("counts per area match the fixture, not a hard-coded catalog total", () => {
  assert.deepEqual(countCatalogByArea(MIXED), {
    ui: 3,
    backend: 1,
    seo: 1,
    agents: 1,
  });
});

test("adding a UI row bumps only the UI count", () => {
  const extra = [...MIXED, row({ title: "Dialog", area: "ui", status: "stable" })];
  assert.deepEqual(countCatalogByArea(extra), {
    ui: 4,
    backend: 1,
    seo: 1,
    agents: 1,
  });
});

test("chip counts ignore Stable only and the search needle", () => {
  const { countsByArea } = catalogFilterView(MIXED, {
    area: "ui",
    status: "stable",
    q: "Alert",
  });
  assert.deepEqual(countsByArea, {
    ui: 3,
    backend: 1,
    seo: 1,
    agents: 1,
  });
});

test("empty index still defines the four chip ids at count 0", () => {
  assert.deepEqual(countCatalogByArea([]), {
    ui: 0,
    backend: 0,
    seo: 0,
    agents: 0,
  });
  const view = catalogFilterView([], { area: "all", status: "all", q: "" });
  assert.deepEqual(view.visible, []);
  assert.equal(view.areaTotal, 0);
});

test("unmapped areas do not invent a chip id", () => {
  const counts = countCatalogByArea([
    ...MIXED,
    row({ title: "Mystery", area: /** @type {never} */ ("mystery"), status: "stable" }),
  ]);
  assert.deepEqual(Object.keys(counts), ["ui", "backend", "seo", "agents"]);
  assert.equal("mystery" in counts, false);
});

test("Stable only keeps exact status stable and drops beta, alpha, and other", () => {
  const visible = filterCatalogEntries(MIXED, { area: "all", status: "stable", q: "" });
  assert.deepEqual(
    visible.map((entry) => entry.title),
    ["Alert", "tryCatch", "JsonLd"],
  );
});

test("a status string that is not stable is dropped when Stable only is on", () => {
  const visible = filterCatalogEntries(
    [row({ title: "Flags", area: "backend", status: "experimental", package: "core" })],
    { area: "all", status: "stable", q: "" },
  );
  assert.deepEqual(visible, []);
});

test("area, Stable only, and search compose on the visible list", () => {
  const { visible, areaTotal, countsByArea } = catalogFilterView(MIXED, {
    area: "ui",
    status: "stable",
    q: "alert",
  });
  assert.deepEqual(
    visible.map((entry) => entry.title),
    ["Alert"],
  );
  assert.equal(areaTotal, 3);
  assert.equal(countsByArea.ui, 3);
});

test("total reflects all active filters (area+status+q), unlike areaTotal", () => {
  const { visible, total, areaTotal } = catalogFilterView(MIXED, {
    area: "ui",
    status: "stable",
    q: "alert",
  });
  assert.deepEqual(
    visible.map((entry) => entry.title),
    ["Alert"],
  );
  assert.equal(total, 1);
  assert.equal(total, visible.length);
  assert.equal(areaTotal, 3);
});

test("total with no filters is the whole index", () => {
  const { total } = catalogFilterView(MIXED, { area: "all", status: "all", q: "" });
  assert.equal(total, MIXED.length);
});

test("total shrinks with status and search alone, not just area", () => {
  assert.equal(catalogFilterView(MIXED, { area: "all", status: "stable", q: "" }).total, 3);
  assert.equal(catalogFilterView(MIXED, { area: "all", status: "all", q: "alert" }).total, 1);
  assert.equal(catalogFilterView(MIXED, { area: "seo", status: "stable", q: "nope" }).total, 0);
});

test("areaTotal is the area size before search and before Stable only", () => {
  const { visible, areaTotal } = catalogFilterView(MIXED, {
    area: "ui",
    status: "stable",
    q: "",
  });
  assert.deepEqual(
    visible.map((entry) => entry.title),
    ["Alert"],
  );
  assert.equal(areaTotal, 3);
});

test("search is case-insensitive on title, need, and package", () => {
  const byTitle = filterCatalogEntries(MIXED, { area: "all", status: "all", q: "ALERT" });
  const byNeed = filterCatalogEntries(MIXED, { area: "all", status: "all", q: "jsonld" });
  const byPackage = filterCatalogEntries(MIXED, { area: "all", status: "all", q: "CORE" });
  assert.deepEqual(
    byTitle.map((entry) => entry.title),
    ["Alert"],
  );
  assert.deepEqual(
    byNeed.map((entry) => entry.title),
    ["JsonLd"],
  );
  assert.deepEqual(
    byPackage.map((entry) => entry.title),
    ["tryCatch"],
  );
});

test("whitespace-only search is no search", () => {
  const visible = filterCatalogEntries(MIXED, { area: "all", status: "all", q: "   " });
  assert.equal(visible.length, MIXED.length);
});

test("empty visible list is an empty array, not a throw", () => {
  assert.deepEqual(filterCatalogEntries(MIXED, { area: "seo", status: "stable", q: "nope" }), []);
  assert.doesNotThrow(() => catalogFilterView([], { area: "ui", status: "stable", q: "x" }));
});

const COUNTER_LABELS = { ui: "UI", backend: "Core", seo: "SEO", agents: "Agents" };

test("catalogCounterItems keeps chip order with short labels, not Core & server", () => {
  const items = catalogCounterItems(countCatalogByArea(MIXED), COUNTER_LABELS);
  assert.deepEqual(
    items.map((item) => [item.id, item.label, item.count]),
    [
      ["ui", "UI", 3],
      ["backend", "Core", 1],
      ["seo", "SEO", 1],
      ["agents", "Agents", 1],
    ],
  );
  assert.equal(CATALOG_AREAS[1].label, "Core and server");
});

test("omitted area query selects UI and lists that area", () => {
  assert.equal(parseCatalogArea(undefined), "ui");
  assert.equal(parseCatalogArea(null), "ui");
  assert.equal(parseCatalogArea(""), "ui");
  const { visible } = catalogFilterView(MIXED);
  assert.deepEqual(
    visible.map((entry) => entry.title),
    ["Alert", "Animate", "Button"],
  );
  assert.equal(CATALOG_DEFAULT_FILTERS.area, "ui");
  assert.equal(CATALOG_DEFAULT_FILTERS.status, "all");
  assert.equal(CATALOG_DEFAULT_FILTERS.q, "");
});

test("empty and missing area query strings select UI", () => {
  assert.equal(readCatalogFilters("").area, "ui");
  assert.equal(readCatalogFilters("q=").area, "ui");
  assert.equal(readCatalogFilters("area=").area, "ui");
  assert.equal(readCatalogFilters("area=ui").area, "ui");
  assert.equal(readCatalogFilters("?area=ui").area, "ui");
  assert.equal(readCatalogFilters(new URLSearchParams()).area, "ui");
});

test("area=all is the mixed list; other known areas win", () => {
  assert.equal(readCatalogFilters("area=all").area, "all");
  assert.equal(readCatalogFilters("?area=all").area, "all");
  assert.equal(readCatalogFilters(new URLSearchParams("area=seo")).area, "seo");
  assert.equal(readCatalogFilters("area=seo").area, "seo");
  const mixed = catalogFilterView(MIXED, { area: "all" });
  assert.equal(mixed.areaTotal, MIXED.length);
  assert.deepEqual(
    mixed.visible.map((entry) => entry.title),
    MIXED.map((entry) => entry.title),
  );
  const seo = catalogFilterView(MIXED, { area: "seo" });
  assert.deepEqual(
    seo.visible.map((entry) => entry.title),
    ["JsonLd"],
  );
});

test("unknown area query falls back to UI, not the mixed list", () => {
  assert.equal(parseCatalogArea("mystery"), "ui");
  assert.equal(parseCatalogArea("UI"), "ui");
  assert.equal(readCatalogFilters("area=mystery").area, "ui");
  const { visible } = catalogFilterView(MIXED, { area: "mystery" });
  assert.deepEqual(
    visible.map((entry) => entry.title),
    ["Alert", "Animate", "Button"],
  );
});

test("status and q defaults stay all and empty when omitted", () => {
  const empty = readCatalogFilters("");
  assert.equal(empty.status, "all");
  assert.equal(empty.q, "");
  const both = readCatalogFilters("status=stable&q=date");
  assert.equal(both.status, "stable");
  assert.equal(both.q, "date");
  assert.equal(both.area, "ui");
});

test("URL write omits default UI, writes area=all, and keeps other areas", () => {
  assert.equal(catalogFilterSearchParams({ area: "ui", status: "all", q: "" }).toString(), "");
  assert.equal(
    catalogFilterSearchParams({ area: "all", status: "all", q: "" }).toString(),
    "area=all",
  );
  assert.equal(
    catalogFilterSearchParams({ area: "seo", status: "all", q: "" }).toString(),
    "area=seo",
  );
  assert.equal(
    catalogFilterSearchParams({ area: "ui", status: "stable", q: "pick" }).toString(),
    "status=stable&q=pick",
  );
});

test("catalogCounterItems fills a missing area with 0 and drops extra keys", () => {
  const items = catalogCounterItems(
    { backend: 2, seo: 0, leftover: 99, mystery: 4 },
    COUNTER_LABELS,
  );
  assert.deepEqual(
    items.map((item) => [item.id, item.count]),
    [
      ["ui", 0],
      ["backend", 2],
      ["seo", 0],
      ["agents", 0],
    ],
  );
});

test("catalogCounterItems on an empty index is four zeros", () => {
  const items = catalogCounterItems(countCatalogByArea([]), COUNTER_LABELS);
  assert.deepEqual(
    items.map((item) => item.count),
    [0, 0, 0, 0],
  );
});

test("catalogCounterItems treats non-finite and missing counts as 0", () => {
  const items = catalogCounterItems(
    { ui: Number.NaN, backend: Number.POSITIVE_INFINITY, agents: 4 },
    COUNTER_LABELS,
  );
  assert.deepEqual(
    items.map((item) => item.count),
    [0, 0, 0, 4],
  );
  const fromNull = catalogCounterItems(null, COUNTER_LABELS);
  assert.deepEqual(
    fromNull.map((item) => item.count),
    [0, 0, 0, 0],
  );
});

test("catalogCounterItems keeps a large count and ignores filters on the source object", () => {
  const { countsByArea } = catalogFilterView(MIXED, {
    area: "ui",
    status: "stable",
    q: "Alert",
  });
  const items = catalogCounterItems({ ...countsByArea, ui: 10000 }, COUNTER_LABELS);
  assert.equal(items[0].count, 10000);
  assert.equal(items[1].count, 1);
  assert.equal(countsByArea.ui, 3);
});
