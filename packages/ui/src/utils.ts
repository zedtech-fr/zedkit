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
      "min-h": ["pane-shrink", "min-h-target", "min-h-status", "min-h-label", { "min-h": ["control-height", "textarea-min-height"] }],
      inset: ["pin-fill"],
      "inset-x": ["pin-x"],
      "inset-y": ["pin-y"],
      bottom: ["pin-bottom", "bottom-control-inline"],
      right: ["pin-right", "right-select-item-inline", "right-control-inline"],
      m: ["trim-margin"],
      mx: ["mx-back"],
      basis: ["basis-field"],
      gap: [
        "gap-detail-panel-gap",
        "gap-data-table-pagination-gap",
        "gap-secret-field-gap",
        "gap-wizard-step-gap",
        "gap-option-card-gap",
        "gap-option-cards-gap",
        "gap-page-header-gap",
        "gap-page-header-actions-gap",
        "gap-button-gap",
        "gap-field",
        "gap-field-inline",
        "gap-field-group-compact",
        "gap-field-group-nested",
        "gap-field-content",
        "gap-status-label-gap",
        "gap-live-pulse-gap",
        "gap-icon",
        "gap-segment",
        "gap-dialog-footer-gap",
        "gap-drawer-footer-gap",
        "gap-section-stack",
        "gap-prose",
        "gap-list",
        "gap-blocks",
        "gap-flush",
        { gap: ["stack-tight", "stack-sm", "stack-md", "stack-lg"] },
      ],
      "gap-x": ["gap-x-wizard-steps-gap", "gap-x-stack-sm", "gap-x-stack-lg", "gap-x-meta", "gap-x-blocks"],
      "gap-y": ["gap-y-wizard-steps-row-gap", "gap-y-stack-sm", "gap-y-stack-tight"],
      "space-y": [
        { "space-y": ["stack-tight", "stack-sm", "stack-md", "stack-lg", "data-table-stack", "wizard-steps-gap", "wizard-steps-row-gap", "form-item-gap", "card-lines"] },
      ],
      h: ["h-control-height", "h-control-height-sm", "h-control-height-lg", "h-field-separator", "h-skeleton-line", "h-logo", "h-logo-row", "h-phone-bar"],
      w: ["w-skeleton-short", "w-skeleton-bar", "w-sidebar-compact"],
      "grid-cols": ["grid-pair", "grid-trio"],
      "col-start-end": ["span-rest"],
      "row-start": ["row-start-first"],
      size: [{ size: ["icon"] }, "size-icon-sm", "size-mark", "size-person", "size-pip", "size-control-height-sm", "size-checkbox", "size-status-label-box", "size-status-dot"],
      py: ["flush-block", "py-control-block", "py-control-block-lg", "py-alert-block", "py-detail-panel-block", "py-select-item-block", "py-table-cell", "py-badge-block", "py-section-sm", "py-section-md", "py-section-lg", "py-section-xl", "empty-state-block", "surface-pad-block", "surface-pad-block-sm"],
      p: ["flush", "p-drawer-chrome-padding", "p-app-shell-padding", "p-table-cell", "p-option-card-padding", "p-field-label-inset", "p-select-separator", "surface-pad-sm", "surface-pad-compact", "surface-pad-md", "pad-row", "glass-pad-sm", "glass-pad-md", "glass-pad-lg"],
      px: ["px-page-gutter", "px-field-pad", "px-button-pad", "px-button-pad-lg", "px-button-inline-sm", "px-alert-inline", "px-detail-panel-inline", "px-drawer-chrome-padding", "px-table-cell", "px-select-item-inline", "px-tabs-trigger-inline", "px-field-separator-inline", "px-control-inline", "px-control-tight", "px-touch", "surface-pad-inline"],
      pl: ["pl-select-item-inline", "pl-control-inline", "pl-list"],
      pr: ["trim-pad-end", "pr-column"],
      pt: ["pt-drawer-chrome-padding", "actions-offset", "content-offset", "trim-pad-top"],
      mt: ["trim-top", "icon-nudge", "icon-nudge-sm", "mt-status", "mt-standfirst", "mt-drawer-handle-top", "mt-table-caption-gap", "mt-tabs-content-gap", "mt-card-section"],
      mb: ["mb-drawer-handle-top", "mb-field-legend-bottom", "mb-stack", "trim-bottom"],
      pb: ["rule-gap", "pb-sheet"],
      ml: ["ml-field-error-indent"],
      top: ["pin-top", "pin-center-y", "top-control-inline", "top-alert-icon-offset"],
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
