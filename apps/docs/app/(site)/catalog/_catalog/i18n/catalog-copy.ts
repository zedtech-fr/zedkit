/** English copy for the catalog page. Keys only; no markup. */
export const catalogCopy = {
  metadata: {
    /** The root layout template adds " · zedkit". */
    title: "Catalog",
    description: "Browse and filter zedkit catalog needs by area, maturity, and search text.",
  },
  jsonLd: {
    title: "Catalog",
    description: "Filterable index of zedkit catalog needs.",
  },
  loading: "Loading catalog…",
  header: {
    title: "Catalog",
    lead: (count: number) => `${count} entries. Search by what you need to do.`,
    loadingResults: "Loading results…",
  },
  counters: {
    ariaLabel: "Catalog area counts",
    labels: {
      ui: "UI",
      backend: "Core",
      seo: "SEO",
      agents: "Agents",
    },
  },
  filters: {
    toolbarAriaLabel: "Catalog filters",
    searchLabel: "Search the catalog",
    searchPlaceholder: "pick a date, confirm a delete, rate limit…",
    chipsAriaLabel: "Category",
    chipLabel: (label: string, count: number) => `${label} · ${count}`,
    stableOnly: "Stable only",
  },
  results: {
    statusLine: (shown: number, total: number) => `Showing ${shown} of ${total}.`,
    stableLegend: "Entries with no label are stable.",
    sectionAriaLabel: "Results",
    empty: "No catalog entries match these filters.",
    clearFiltersLink: "Clear filters",
  },
} as const;

export type CatalogCopy = typeof catalogCopy;
