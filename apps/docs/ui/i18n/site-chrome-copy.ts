/** English copy for site chrome. Keys only; no markup. */
export const siteChromeCopy = {
  skipToContent: "Skip to content",
  getStarted: "Get started",
  brand: { name: "zedkit", homeAriaLabel: "zedkit home" },
  search: { triggerAriaLabel: "Search the documentation" },
  theme: { toggleAriaLabel: "Toggle theme" },
  nav: {
    openNavigation: "Open navigation",
    openMenu: "Open menu",
    menu: "Menu",
    siteNavigation: "Site navigation",
    guides: "Guides",
    github: "GitHub",
  },
  footer: {
    maintainer: "Maintained by ZED TECH",
    links: {
      documentation: "Documentation",
      catalog: "Catalog",
      startWithoutWritingCode: "Start without writing code",
      mitLicense: "MIT License",
      sourceRepository: "Source repository",
      npmOrganisation: "npm organization",
      reportABug: "Report a bug",
      uiChangelog: "UI changelog",
    },
  },
  version: {
    latest: "Latest",
    releasesAriaLabel: (version: string) => `v${version} (releases)`,
    shell: (version: string) => `v${version}`,
  },
} as const;

export type SiteChromeCopy = typeof siteChromeCopy;
