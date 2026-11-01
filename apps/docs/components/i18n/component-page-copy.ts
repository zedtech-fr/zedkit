/** English copy for catalog component pages. Keys only; no markup. */
export const componentPageCopy = {
  npmOnlyLead: "This component ships on npm only; there is no copy-source registry brick.",
  npmInstallLeadBeforeLink: "Install the published package, then import from it. Wire the kit CSS first — see",
  npmInstallLeadLink: "getting started",
  npmInstallLeadAfterLink: ".",
  codeBlockInstall: "Install",
  packageVersionLine: (version: string) => `Package version: ${version} (changesets).`,
  guidance: {
    who: "Who is it for?",
    useWhen: "When should I use it?",
    avoidWhen: "When should I pick something else?",
  },
  sections: {
    installOrCopy: "Install or copy",
    usageAndStates: "Usage and states",
    props: "Props",
    accessibility: "Accessibility",
    related: "Related",
    troubleshooting: "Troubleshooting",
  },
  packageManagerTabs: ["pnpm", "npm", "yarn"] as const,
  /** `value` is an id fragment (no spaces: aria-controls would split it); `label` is what readers see. */
  adoptionTabs: [
    { value: "npm", label: "npm package" },
    { value: "registry", label: "registry copy" },
  ] as const,
  registryCopyLead:
    "Copy the source into your repo with the shadcn CLI, then import it from your own components folder. No package to install.",
  registryContinuation: "New to shadcn? Set up the CLI and theme tokens first.",
  registryContinuationLink: "Zedkit and shadcn",
  usageImportNote: (registry: string) =>
    `Examples import from the package. With copied source, import from @/components/ui/${registry} instead.`,
  codeBlockShadcnAdd: "shadcn add",
  codeBlockImport: "Import",
  noExtraProps: "No extra props documented.",
  noRelatedPages: "No related pages.",
  troubleshootingNone: "None yet.",
} as const;

export type ComponentPageCopy = typeof componentPageCopy;
