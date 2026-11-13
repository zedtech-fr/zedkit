/** English copy for site chrome. Keys only; no markup. */
export const siteChromeCopy = {
  skipToContent: "Skip to content",
  getStarted: "Try it yourself",
  brand: { name: "zedkit", homeAriaLabel: "zedkit home" },
  search: { triggerAriaLabel: "Search documentation" },
  nav: {
    siteNavigation: "Site navigation",
    menu: "Menu",
    docsPages: "Docs pages",
    docsNavigation: "Documentation",
    github: "GitHub",
    opensInNewTab: "opens in a new tab",
  },
  footer: {
    credit: "by Zed Tech · MIT",
    links: {
      docs: "Docs",
      catalog: "Catalog",
      github: "GitHub",
      npm: "npm",
      company: "zedtech.fr",
    },
  },
  version: {
    latest: "Latest",
    releasesAriaLabel: (version: string) => `v${version} (releases)`,
    shell: (version: string) => `v${version}`,
  },
} as const;

export type SiteChromeCopy = typeof siteChromeCopy;
