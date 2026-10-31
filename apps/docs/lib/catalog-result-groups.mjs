/** @typedef {import("../content/catalog-index").CatalogIndexEntry} CatalogIndexEntry */

/** @typedef {{ id: string; label: string; entries: CatalogIndexEntry[] }} CatalogResultGroup */

const GROUP_DEFS = [
  { id: "ui", label: "UI", packages: ["ui"] },
  { id: "backend", label: "Backend", packages: ["core", "server", "nest"] },
  { id: "seo", label: "SEO", packages: ["seo", "payload-seo"] },
  { id: "ai", label: "AI", packages: ["ai"] },
  { id: "quality", label: "Quality", packages: ["quality"] },
  { id: "observability", label: "Observability", packages: ["observability"] },
  { id: "more", label: "More", packages: ["flags", "devtools", "i18n", "storage"] },
];

const packageToGroup = new Map(
  GROUP_DEFS.flatMap((group) => group.packages.map((pkg) => [pkg, group.id])),
);

/** @param {CatalogIndexEntry[]} entries */
export function groupCatalogResults(entries) {
  /** @type {Map<string, CatalogIndexEntry[]>} */
  const buckets = new Map();
  for (const entry of entries) {
    const id = packageToGroup.get(entry.package) ?? "more";
    const list = buckets.get(id) ?? [];
    list.push(entry);
    buckets.set(id, list);
  }
  return GROUP_DEFS.filter((def) => (buckets.get(def.id)?.length ?? 0) > 0).map((def) => {
    const entries = buckets.get(def.id);
    return { id: def.id, label: def.label, entries: entries ?? [] };
  });
}
