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
    areaLabel: "Area",
    areaAriaLabel: "Area",
    areaPlaceholder: "All areas",
    maturityLabel: "Maturity",
    maturityAriaLabel: "Maturity",
    maturityPlaceholder: "All",
    maturityAll: "All",
    clearFilters: "Clear filters",
    searchChip: (query: string) => `“${query}”`,
  },
  results: {
    entry: "entry",
    entries: "entries",
    statusLine: (count: number) => `${count} ${count === 1 ? "entry" : "entries"}`,
    heading: "Results",
    sectionAriaLabel: "Results",
    empty: "No catalog entries match these filters.",
    clearFiltersLink: "Clear filters",
    jumpNavAriaLabel: "Jump to category",
    groupJumpLink: (label: string, count: number) => `${label} (${count})`,
    groupHeading: (label: string, count: number) => `${label} · ${count}`,
  },
} as const;

export type CatalogCopy = typeof catalogCopy;
