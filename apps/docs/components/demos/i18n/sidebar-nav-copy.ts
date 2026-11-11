/** English copy for the sidebar nav demos. Keys only; no markup. */
export const sidebarNavCopy = {
  navLabel: "Runs",
  nightly: "Nightly",
  staging: "Staging",
  preview: "Preview",
  nightlyMeta: "2m ago",
  stagingMeta: "1h ago",
  nightlyCount: "3",
  groupLabel: "Scheduled",
} as const;

export type SidebarNavCopy = typeof sidebarNavCopy;
