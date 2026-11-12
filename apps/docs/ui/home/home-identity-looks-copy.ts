/** English copy for the home identity examples (section chrome only). Keys only; no markup. */

export const homeIdentityLooksCopy = {
  title: "Every screen, the same product.",
  body: "Agents are very good at inventing components. That is the problem. A look sets type, shape, density and color together, and one attribute switches it.",
  liveNote: "Live components, not screenshots.",
  tabsAriaLabel: "Examples",
  /** One line under the example: what the look is made of. */
  caption: (label: string, type: string, shape: string) => `${label}: ${type}; ${shape}.`,
  /** What each example is, by identity id. The tab leads with this; the identity name follows. */
  products: {
    mist: "Dev console",
    press: "Newsroom",
    maison: "Bag shop",
  },
  openEditor: "Try the demo editor",
  startWithoutCode: "Start without writing code",
  seeInComponents: "See identities in components",
} as const;
