/** English copy for catalog component pages. Keys only; no markup. */
export const componentPageCopy = {
  npmOnlyLead: "This component ships on npm only; there is no copy-source registry brick.",
  npmInstallLeadBeforeLink: "Install the published package, then import from it. Wire the kit CSS first — see",
  npmInstallLeadLink: "getting started",
  npmInstallLeadAfterLink: ".",
  codeBlockInstall: "Install",
  packageVersionLine: (version: string) => `Package version: ${version} (changesets).`,
  guidance: {
    who: "Who",
    useWhen: "Use when",
    avoidWhen: "Avoid when",
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
  adoptionTabs: ["npm package", "registry copy"] as const,
  registryCopyLead:
    "Copy the brick into your repo with the shadcn CLI. Imports are rewritten for your app; keep this path separate from the npm package install above.",
  codeBlockShadcnAdd: "shadcn add",
  codeBlockImport: "Import",
  noExtraProps: "No extra props documented.",
  noRelatedPages: "No related pages.",
  troubleshootingNone: "None yet.",
} as const;

export type ComponentPageCopy = typeof componentPageCopy;
