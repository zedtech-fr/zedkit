/** @typedef {import("../content/catalog-index").CatalogIndexEntry} CatalogIndexEntry */

/** @typedef {{ id: "ui" | "backend" | "seo" | "agents"; label: string }} CatalogChipArea */

/** @typedef {"ui" | "backend" | "seo" | "agents" | "all"} CatalogFilterArea */

/** @typedef {{ area: CatalogFilterArea; status: string; q: string }} CatalogFilters */

/** @type {readonly CatalogChipArea[]} */
export const CATALOG_AREAS = Object.freeze([
  { id: "ui", label: "UI" },
  { id: "backend", label: "Core and server" },
  { id: "seo", label: "SEO" },
  { id: "agents", label: "Agents" },
]);

const AREA_IDS = new Set(CATALOG_AREAS.map((area) => area.id));

/** @type {CatalogChipArea["id"]} */
export const CATALOG_DEFAULT_AREA = "ui";

/** @type {Readonly<CatalogFilters>} */
export const CATALOG_DEFAULT_FILTERS = Object.freeze({
  area: CATALOG_DEFAULT_AREA,
  status: "all",
  q: "",
});

/**
 * Missing, empty, or unknown area means UI. Explicit `all` is the mixed list.
 *
 * @param {string | null | undefined} value
 * @returns {CatalogFilterArea}
 */
export function parseCatalogArea(value) {
  if (value === "all") return "all";
  if (typeof value === "string" && AREA_IDS.has(value)) return value;
  return CATALOG_DEFAULT_AREA;
}

/**
 * @param {string | URLSearchParams} search
 * @returns {CatalogFilters}
 */
export function readCatalogFilters(search) {
  const params =
    typeof search === "string"
      ? new globalThis.URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
      : search;
  return {
    area: parseCatalogArea(params.get("area")),
    status: params.get("status") ?? "all",
    q: params.get("q") ?? "",
  };
}

/**
 * Omit `area` for the default UI list. Write `area=all` when mixed.
 *
 * @param {{ area?: string; status?: string; q?: string }} filters
 */
export function catalogFilterSearchParams(filters) {
  const params = new globalThis.URLSearchParams();
  const area = parseCatalogArea(filters.area);
  if (area === "all") params.set("area", "all");
  else if (area !== CATALOG_DEFAULT_AREA) params.set("area", area);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.q) params.set("q", filters.q);
  return params;
}

/** @returns {Record<CatalogChipArea["id"], number>} */
function emptyCounts() {
  return { ui: 0, backend: 0, seo: 0, agents: 0 };
}

/** @param {CatalogIndexEntry[]} entries */
export function countCatalogByArea(entries) {
  const counts = emptyCounts();
  for (const entry of entries) {
    if (AREA_IDS.has(entry.area)) counts[entry.area] += 1;
  }
  return counts;
}

/**
 * Four labelled counts for the Catalog glass card. Order follows CATALOG_AREAS.
 * Missing or non-finite values become 0; keys outside the four areas are dropped.
 *
 * @param {Partial<Record<CatalogChipArea["id"], number>> | null | undefined} counts
 * @param {Record<CatalogChipArea["id"], string>} labels
 * @returns {readonly { id: CatalogChipArea["id"]; label: string; count: number }[]}
 */
export function catalogCounterItems(counts, labels) {
  const source = counts ?? {};
  return CATALOG_AREAS.map((area) => {
    const raw = source[area.id];
    const count = typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
    return { id: area.id, label: labels[area.id], count };
  });
}

/**
 * @param {CatalogIndexEntry[]} entries
 * @param {{ area?: string; status?: string; q?: string }} [filters]
 */
export function filterCatalogEntries(entries, filters = {}) {
  const area = parseCatalogArea(filters.area);
  const status = filters.status ?? "all";
  const needle = (filters.q ?? "").trim().toLowerCase();
  return entries.filter((entry) => {
    if (area !== "all" && entry.area !== area) return false;
    if (status !== "all" && entry.status !== status) return false;
    if (needle.length === 0) return true;
    const hay = `${entry.title} ${entry.need} ${entry.package}`.toLowerCase();
    return hay.includes(needle);
  });
}

/**
 * @param {CatalogIndexEntry[]} entries
 * @param {{ area?: string; status?: string; q?: string }} [filters]
 */
export function catalogFilterView(entries, filters = {}) {
  const area = parseCatalogArea(filters.area);
  const countsByArea = countCatalogByArea(entries);
  const visible = filterCatalogEntries(entries, { ...filters, area });
  const areaTotal = area !== "all" && AREA_IDS.has(area) ? countsByArea[area] : entries.length;
  return { countsByArea, visible, areaTotal };
}
