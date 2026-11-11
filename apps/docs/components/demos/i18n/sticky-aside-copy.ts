/** English copy for the sticky-aside demos. Keys only; no markup. */
export const stickyAsideCopy = {
  example: {
    steps: [
      { title: "Install the package", body: "Add the UI kit to your app." },
      { title: "Import the styles", body: "Pull in the kit CSS once in your globals." },
      { title: "Render a control", body: "Use a primitive in your page." },
    ],
    stepLabel: (n: number) => `Step ${n}`,
    renderedExample: "Rendered example",
    save: "Save",
  },
  docSteps: {
    title: "Write the guide",
    body: "Steps stay in the main column for reading order.",
    summary:
      "Summary or preview — sticks while the section scrolls; pass scrollable when this block is taller than the viewport.",
  },
} as const;

export type StickyAsideCopy = typeof stickyAsideCopy;
