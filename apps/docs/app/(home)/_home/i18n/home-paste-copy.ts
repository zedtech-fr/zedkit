/** English copy for the home paste-one-line band. Keys only; no markup. */
export const homePasteCopy = {
  section: {
    title: "Paste one line. Go to lunch.",
    description:
      "Name the kits. The agent follows the map, installs them in order and validates once at the end.",
  },
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
  skillsAgents: (skills: number, agents: number) => `${skills} · agents/ ${agents}`,
  lands: {
    ai: {
      kit: "AI",
      when: "after lunch",
      files: [
        { path: "AGENTS.md" },
        { path: ".agents/product.md", note: "what the product does" },
        { path: ".agents/domain/tasks.md", note: "its rules" },
        { path: ".agents/skills/" },
      ],
    },
    ui: {
      kit: "UI",
      when: "same run",
      files: [
        { path: "package.json", note: "@zedtech/zedkit-ui" },
        { path: "src/app/globals.css", note: "kit styles" },
        { path: "src/app/layout.tsx", note: 'data-identity="glass"', accent: true },
        { path: ".agents/design.md", note: "which components to use" },
      ],
    },
  },
} as const;
