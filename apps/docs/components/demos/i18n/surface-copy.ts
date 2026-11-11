/** English copy for the surface demo. Keys only; no markup. */
export const surfaceCopy = {
  solid: {
    label: "Solid panel",
    description: "Border, card fill, and shadow-md from one Surface.",
  },
  glass: {
    label: "Glass panel",
    description: "Frosted under the glass identity; solid popover elsewhere.",
  },
  widgetTrigger: "Widget trigger",
} as const;

export type SurfaceCopy = typeof surfaceCopy;
