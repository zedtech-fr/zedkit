// Derived from shadcn/ui (utils (cn)) — see Provenance in packages/ui/README.md. Tolerated exception: migrated to custom code only when customization needs it.
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Custom theme tokens tailwind-merge does not know. Role classes join the
// group they conflict with, so a later override replaces the earlier one.
// Structural utilities (content-shrink, pin-fill) are not spacing steps.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": ["text-form-hint", "text-control"],
      "max-w": [{ "max-w": ["narrow", "reading", "default", "wide"] }],
      "min-w": ["content-shrink"],
      "min-h": ["pane-shrink", { "min-h": ["control-height", "textarea-min-height"] }],
      inset: ["pin-fill"],
      "inset-x": ["pin-x"],
      "inset-y": ["pin-y"],
      top: ["pin-top"],
      bottom: ["pin-bottom"],
      left: ["pin-left"],
      right: ["pin-right"],
      p: ["flush"],
      m: ["trim-margin"],
      mt: ["trim-top"],
      gap: [{ gap: ["stack-sm", "stack-md", "stack-lg"] }],
      "space-y": [{ "space-y": ["stack-lg"] }],
      size: [{ size: ["icon"] }],
      px: ["px-page-gutter", "px-field-pad", "px-button-pad", "px-button-pad-lg"],
      py: ["flush-block", "py-section-sm", "py-section-md", "py-section-lg", "py-section-xl"],
    },
  },
});

/**
 * Merges class names, with tailwind-merge resolving conflicting
 * Tailwind utilities (last one wins). Every component takes an
 * optional className that flows through here.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
