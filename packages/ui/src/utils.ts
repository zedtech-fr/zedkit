// Derived from shadcn/ui (utils (cn)) — see Provenance in packages/ui/README.md. Tolerated exception: migrated to custom code only when customization needs it.
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Custom theme size tokens in the text-* shape would be mistaken
// for text colors by the default config (and dropped as conflicts),
// so they join the font-size group explicitly. Same for the layout
// token scale: container widths, page gutter and section steps are
// unknown to the default config, so they join their utility groups
// explicitly or a consumer override would silently coexist.
// Shared spacing roles. Same calc step as the old numeric utility, so an
// identity `--spacing` still reaches them, and a later numeric or role class
// in `cn()` replaces the earlier one.
const stackStep = [
  "zero",
  "hairline",
  "stack-3xs",
  "stack-2xs",
  "stack-xs",
  "stack-sm",
  "stack-md",
  "stack-3h",
  "stack-lg",
  "stack-xl",
  "stack-2xl",
  "stack-3xl",
  "stack-4xl",
  "stack-5xl",
  "stack-6xl",
  "stack-7xl",
  "stack-8xl",
  "stack-9xl",
  "stack-10xl",
  "stack-11xl",
  "stack-12xl",
  "stack-13xl",
  "stack-14xl",
  "stack-15xl",
  "stack-16xl",
];

const step = (key: string, extra: string[] = []) => [{ [key]: [...extra, ...stackStep] }];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": ["text-form-hint", "text-control"],
      "max-w": step("max-w", ["narrow", "reading", "default", "wide"]),
      "min-w": step("min-w"),
      "min-h": step("min-h", ["control-height", "textarea-min-height"]),
      "max-h": step("max-h"),
      w: step("w"),
      h: step("h"),
      size: step("size", ["icon"]),
      gap: step("gap"),
      "gap-x": step("gap-x"),
      "gap-y": step("gap-y"),
      "space-x": step("space-x"),
      "space-y": step("space-y"),
      p: step("p"),
      px: [
        "px-page-gutter",
        "px-field-pad",
        "px-button-pad",
        "px-button-pad-lg",
        ...step("px"),
      ],
      py: [
        "py-section-sm",
        "py-section-md",
        "py-section-lg",
        "py-section-xl",
        ...step("py"),
      ],
      pt: step("pt"),
      pr: step("pr"),
      pb: step("pb"),
      pl: step("pl"),
      ps: step("ps"),
      pe: step("pe"),
      m: step("m"),
      mx: step("mx"),
      my: step("my"),
      mt: step("mt"),
      mr: step("mr"),
      mb: step("mb"),
      ml: step("ml"),
      ms: step("ms"),
      me: step("me"),
      inset: step("inset"),
      "inset-x": step("inset-x"),
      "inset-y": step("inset-y"),
      top: step("top"),
      right: step("right"),
      bottom: step("bottom"),
      left: step("left"),
      start: step("start"),
      end: step("end"),
      basis: step("basis"),
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
