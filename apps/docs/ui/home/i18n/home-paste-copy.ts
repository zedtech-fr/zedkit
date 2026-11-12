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
    { label: "2 seconds", body: "The agent has the kits you named and starts the map." },
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
  landsHeading: "What lands",
  nestLands: "Nest (API) lands with UI: the package pin and the boot file.",
  lands: {
    ui: {
      kit: "UI",
      when: "during the run",
      files: [
        { path: "package.json", note: "the UI package" },
        { path: "globals.css", note: "kit styles" },
        { path: "layout.tsx", note: "Glass on the document" },
        { path: ".agents/design.md", note: "which components to use" },
      ],
    },
    ai: {
      kit: "AI",
      when: "after lunch",
      files: [
        { path: "AGENTS.md" },
        { path: ".agents/product.md", note: "what the product does" },
        { path: ".agents/domain/", note: "per-domain notes" },
        { path: ".agents/skills/", note: "the skills to follow" },
      ],
    },
  },
} as const;
