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
      "min-w": ["content-shrink", "min-w-target"],
      "min-h": ["pane-shrink", "min-h-target", { "min-h": ["control-height", "textarea-min-height"] }],
      inset: ["pin-fill"],
      "inset-x": ["pin-x"],
      "inset-y": ["pin-y"],
      bottom: ["pin-bottom"],
      right: ["pin-right"],
      m: ["trim-margin"],
      gap: [
        "gap-detail-panel-gap",
        "gap-data-table-pagination-gap",
        "gap-secret-field-gap",
        "gap-wizard-step-gap",
        "gap-option-card-gap",
        "gap-option-cards-gap",
        "gap-page-header-gap",
        "gap-page-header-actions-gap",
        { gap: ["stack-sm", "stack-md", "stack-lg"] },
      ],
      "gap-x": ["gap-x-wizard-steps-gap"],
      "gap-y": ["gap-y-wizard-steps-row-gap"],
      "space-y": [
        { "space-y": ["stack-lg", "data-table-stack", "wizard-steps-gap", "wizard-steps-row-gap"] },
      ],
      h: ["h-control-height", "h-control-height-sm", "h-control-height-lg"],
      size: [{ size: ["icon"] }, "size-checkbox", "size-status-label-box"],
      py: ["flush-block", "py-control-block", "py-control-block-lg", "py-alert-block", "py-detail-panel-block", "py-section-sm", "py-section-md", "py-section-lg", "py-section-xl"],
      p: ["flush", "p-drawer-chrome-padding", "p-app-shell-padding", "p-table-cell", "p-option-card-padding"],
      px: ["px-page-gutter", "px-field-pad", "px-button-pad", "px-button-pad-lg", "px-alert-inline", "px-detail-panel-inline", "px-drawer-chrome-padding", "px-table-cell"],
      pt: ["pt-drawer-chrome-padding"],
      mt: ["trim-top", "mt-drawer-handle-top", "mt-table-caption-gap"],
      mb: ["mb-drawer-handle-top"],
      top: ["pin-top", "top-alert-icon-offset"],
      left: ["pin-left", "left-alert-icon-offset"],
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
