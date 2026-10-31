/** @typedef {import("../content/catalog-index").CatalogIndexEntry} CatalogIndexEntry */

/** @typedef {{ id: string; label: string; entries: CatalogIndexEntry[] }} CatalogResultGroup */

const GROUP_DEFS = [
  { id: "ui", label: "UI", area: "ui" },
  { id: "backend", label: "Core & server", area: "backend" },
  { id: "seo", label: "SEO", area: "seo" },
  { id: "agents", label: "Agents", area: "agents" },
];

const areaToGroup = new Map(GROUP_DEFS.map((group) => [group.area, group.id]));

/** @param {CatalogIndexEntry[]} entries */
export function groupCatalogResults(entries) {
  /** @type {Map<string, CatalogIndexEntry[]>} */
  const buckets = new Map();
  for (const entry of entries) {
    const id = areaToGroup.get(entry.area) ?? "backend";
    const list = buckets.get(id) ?? [];
    list.push(entry);
    buckets.set(id, list);
  }
  return GROUP_DEFS.filter((def) => (buckets.get(def.id)?.length ?? 0) > 0).map((def) => {
    const entries = buckets.get(def.id);
    return { id: def.id, label: def.label, entries: entries ?? [] };
  });
}
