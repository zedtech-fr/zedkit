/** English copy for the scroll-gallery demos. Keys only; no markup. */
export const scrollGalleryCopy = {
  looksAriaLabel: "Looks",
  lookLabels: {
    one: "One",
    two: "Two",
    three: "Three",
    four: "Four",
    five: "Five",
  },
  chips: {
    alpha: "Alpha",
    beta: "Beta",
    gamma: "Gamma",
    delta: "Delta",
  },
} as const;

export type ScrollGalleryCopy = typeof scrollGalleryCopy;
