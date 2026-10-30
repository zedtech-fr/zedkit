// Derived from shadcn/ui (utils (cn)) — see Provenance in packages/ui/README.md. Tolerated exception: migrated to custom code only when customization needs it.
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Custom theme size tokens in the text-* shape would be mistaken
// for text colors by the default config (and dropped as conflicts),
// so they join the font-size group explicitly. Same for the layout
// token scale: container widths, page gutter and section steps are
// unknown to the default config, so they join their utility groups
// explicitly or a consumer override would silently coexist.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": ["text-form-hint", "text-control"],
      "max-w": [{ "max-w": ["narrow", "reading", "default", "wide"] }],
      "min-h": [{ "min-h": ["control-height", "textarea-min-height"] }],
      px: ["px-page-gutter"],
      py: ["py-section-sm", "py-section-md", "py-section-lg", "py-section-xl"],
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
