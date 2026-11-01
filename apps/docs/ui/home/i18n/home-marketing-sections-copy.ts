export const homeSecondaryCopy = {
  section: {
    title: "More in the kit",
    description: "Backend, SEO, agents, and visual identities when you need them.",
  },
  entryNeedsLine: (needCount: number, summaryLead: string) => `${needCount} needs · ${summaryLead}.`,
  optionalAgentsHeading: "Optional: coding agents",
  identities: {
    heading: "Six visual identities",
    body: "Tide, Mist, Press, Volt, Maison, and Glass — switch Display on the hero demo, or open the editor.",
    tryEditor: "Try the demo editor",
    startWithoutCode: "Start without writing code",
  },
  identitySpecimen: {
    heading: "Visual example",
    sampleNameLabel: "Name",
    sampleNameValue: "console",
    sampleRegionLabel: "Region",
    sampleRegionValue: "eu",
  },
} as const;

export const homeEntryPointsCopy = {
  section: {
    title: "Choose an area",
    description: "Four package families in the catalog, with up-to-date counts on each card.",
  },
  documentedNeeds: (needCount: number) => `${needCount} documented needs in the catalog`,
} as const;

export const homeScenariosCopy = {
  section: {
    title: "Start from your situation",
    description:
      "Each card opens a doc page with the install command, an example, and a live preview when available.",
  },
  youWant: "You want",
  doThis: "Do this",
} as const;

export const homeProofsCopy = {
  section: {
    title: "What you can verify",
  },
  versionReleases: (version: string) => ({
    title: `v${version} releases`,
    body: "See what shipped in each public release on GitHub.",
    linkLabel: `v${version} (releases)`,
  }),
  uiCatalog: (uiComponents: number, livePreviews: number) => ({
    title: `${uiComponents} UI catalog entries`,
    body: `${livePreviews} include a live preview you can try on the page.`,
  }),
  packagesNeeds: (packages: number, needs: number) => ({
    title: `${packages} packages, ${needs} needs`,
    body: "Counts are kept in sync with the catalog, so they match the published packages.",
  }),
  theme: {
    title: "Light and dark theme",
    body: "Light and dark tokens are built in — try the toggle in the header.",
    linkLabel: "Theme setup page",
  },
  a11y: {
    title: "Accessibility checks",
    body: "Rendered components are checked automatically for accessibility issues.",
    linkLabel: "axe test suite",
  },
} as const;
