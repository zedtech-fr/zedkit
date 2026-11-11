/** English copy for the catalog page. Keys only; no markup. */
export const catalogCopy = {
  header: {
    title: "Catalog",
    lead: "Search by need. Filter by area or maturity if you want — share or reload keeps the URL.",
    loadingResults: "Loading results…",
  },
  filters: {
    toolbarAriaLabel: "Catalog filters",
    searchLabel: "Catalog search",
    searchPlaceholder: "Need or title",
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
