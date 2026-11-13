/** English copy for the home limits band. Keys only; no markup. */
export const homeLimitsCopy = {
  section: {
    title: "What it doesn't do.",
    description: "Better to read this here than to find out mid-project.",
  },
  items: [
    {
      title: "It won't make your code bug-free.",
      body: "It catches more bugs before they reach you. Risky changes still deserve your eyes.",
    },
    {
      title: "It won't test your product in a browser.",
      body: "The validator checks the kit's own wiring. Rendering and focus stay yours.",
    },
    {
      title: "Not every component is finished.",
      body: "Each is marked stable, beta or alpha. Look before you build on one.",
    },
  ],
} as const;
