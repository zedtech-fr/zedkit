/** English copy for the home paste-one-line band. Keys only; no markup. */
export const homePasteCopy = {
  section: {
    title: "Paste one line. Go to lunch.",
    description:
      "Name the kits. The agent follows the map, installs them in order and validates once at the end.",
  },
  fullSteps: "Full install steps",
  fullStepsHref: "/docs/getting-started#install-or-copy",
  timeline: [
    { label: "2 seconds", body: "The kits you named land in your repo." },
    {
      label: "15 to 45 min",
      body: "The agent reads your code, docs and CI, then asks at most eight questions.",
    },
    {
      label: "Same run",
      body: "For UI it adds the package, the styles and one attribute, and keeps your own conventions.",
    },
    { label: "Any time after", body: "Run the prompt again to add a kit. It is safe to repeat." },
  ],
  lands: {
    ai: {
      kit: "AI",
      when: "after lunch",
      files: [
        { path: "AGENTS.md" },
        { path: ".agents/product.md", note: "what the product does" },
        { path: ".agents/domain/", note: "its rules" },
        { path: ".agents/skills/" },
      ],
    },
    ui: {
      kit: "UI",
      when: "same run",
      files: [
        { path: "package.json", note: "@zedtech/zedkit-ui" },
        { path: "globals.css", note: "kit styles" },
        { path: "layout.tsx", note: 'data-identity="glass"' },
        { path: ".agents/design.md", note: "which components to use" },
      ],
    },
  },
} as const;
