/** English copy for catalog component pages. Keys only; no markup. */
export const componentPageCopy = {
  packageVersionLine: (version: string) => `Package version ${version}.`,
  header: {
    stable: "Stable",
    source: "Source",
    breadcrumb: (group: string) => `UI / ${group}`,
  },
  guidance: {
    who: "Who is it for?",
    useWhen: "When should I use it?",
    avoidWhen: "When should I pick something else?",
  },
  sections: {
    installOrCopy: "Kit not installed yet?",
    usageAndStates: "Use it",
    guidance: "Guidance",
    props: "Props",
    accessibility: "Accessibility",
    related: "Related",
    troubleshooting: "Troubleshooting",
  },
  usageImportNote: (registry: string) =>
    `Examples import from the package. With copied source, import from @/components/ui/${registry} instead.`,
} as const;

export type ComponentPageCopy = typeof componentPageCopy;
