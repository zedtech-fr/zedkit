/** @typedef {import("../content/catalog-index").CatalogIndexEntry} CatalogIndexEntry */

/** @typedef {{ id: "ui" | "backend" | "seo" | "agents"; label: string }} CatalogChipArea */

/** @type {readonly CatalogChipArea[]} */
export const CATALOG_AREAS = Object.freeze([
  { id: "ui", label: "UI" },
  { id: "backend", label: "Core & server" },
  { id: "seo", label: "SEO" },
  { id: "agents", label: "Agents" },
]);

const AREA_IDS = new Set(CATALOG_AREAS.map((area) => area.id));

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
 * @param {CatalogIndexEntry[]} entries
 * @param {{ area?: string; status?: string; q?: string }} [filters]
 */
export function filterCatalogEntries(entries, filters = {}) {
  const area = filters.area ?? "all";
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
  const area = filters.area ?? "all";
  const countsByArea = countCatalogByArea(entries);
  const visible = filterCatalogEntries(entries, filters);
  const areaTotal = area !== "all" && AREA_IDS.has(area) ? countsByArea[area] : entries.length;
  return { countsByArea, visible, areaTotal };
}
