/** English copy for the home same-idea band. Keys only; no markup. */
export const homeSameIdeaCopy = {
  section: {
    title: "Same idea, two places.",
    description: "Tell the agent once what a good team already knows, and keep it in the repo.",
  },
  /** Kit inventory; home-bundle.test.mjs fails when skill/agent/identity dirs drift. */
  kitCounts: {
    skills: 48,
    agents: 23,
    looks: 6,
  },
  windows: {
    plan: "plan",
    build: "build",
    check: "check",
    save: "Save",
    active: "Active",
    arrow: "→",
    plus: "+",
  },
  cards: {
    ai: {
      title: "zedkit AI",
      tagline: "How the work gets done.",
      inventory: (skills: number, agents: number) =>
        `${skills} skills, ${agents} agents and the commands to run them`,
      rules: "Reads your repo once and writes its rules down",
      tools: "The same setup in Cursor, Claude Code, Codex and Muse",
      link: "AI setup guide",
      href: "/docs/ai/setup",
    },
    ui: {
      title: "zedkit UI",
      tagline: "What gets built.",
      components: (count: number) => `${count} React components behind one import`,
      looks: "Six looks, or one made for your brand",
      stack: "React 19 and Tailwind CSS 4, from npm or as source",
      link: "Browse the catalog",
      href: "/catalog",
    },
    together: {
      title: "Together",
      tagline: "One prompt, one map, the kits you name.",
      bullets: [
        "Name them in the prompt: AI, UI, Nest",
        "It installs only what you asked for, in the right order",
        "One validation at the end, one report",
      ],
      link: "Read map.md",
      href: "/map.md",
    },
  },
  lands: {
    heading: "A working kit in your repo on day one.",
    proof: (skills: number, agents: number, components: number, looks: number) =>
      `The agent can plan, review and ship with ${skills} skills, ${agents} agents, ${components} components and ${looks} looks. MIT.`,
  },
} as const;
