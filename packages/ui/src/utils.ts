// Derived from shadcn/ui (utils (cn)) — see Provenance in packages/ui/README.md. Tolerated exception: migrated to custom code only when customization needs it.
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Custom theme tokens tailwind-merge does not know. Role classes join the
// group they conflict with, so a later override replaces the earlier one.
// Structural utilities (content-shrink, pin-fill) are not spacing steps.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": ["text-form-hint", "text-control", "text-dense", "text-caption", "text-overlay-title", "text-alert-title"],
      "max-w": [{ "max-w": ["narrow", "reading", "default", "wide"] }, "max-w-scope"],
      "min-w": ["content-shrink", "min-w-target", "min-w-name", "min-w-date"],
      "min-h": ["pane-shrink", "min-h-target", "min-h-floor", "min-h-status", "min-h-label", "min-h-phone-bar", "min-h-bar", "min-h-hero", "min-h-aside", "min-h-segment", { "min-h": ["control-height", "textarea-min-height"] }],
      inset: ["pin-fill"],
      "inset-x": ["pin-x"],
      "inset-y": ["pin-y", "inset-y-panel"],
      bottom: ["pin-bottom", "bottom-control-inline", "bottom-send", "bottom-float"],
      right: ["pin-right", "right-select-item-inline", "right-control-inline", "right-send", "right-float", "right-panel"],
      left: ["pin-left", "left-alert-icon-offset", "left-float"],
      m: ["trim-margin"],
      mx: ["mx-back"],
      basis: ["basis-field", "basis-number", "basis-text", "basis-tile"],
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
        "gap-scenes",
        "gap-prose",
        "gap-list",
        "gap-blocks",
        "gap-flush",
        { gap: ["stack-tight", "stack-sm", "stack-md", "stack-lg"] },
      ],
      "gap-x": ["gap-x-wizard-steps-gap", "gap-x-stack-sm", "gap-x-stack-lg", "gap-x-meta", "gap-x-blocks", "gap-x-logos", "gap-x-results"],
      "gap-y": ["gap-y-wizard-steps-row-gap", "gap-y-stack-sm", "gap-y-stack-md", "gap-y-stack-lg", "gap-y-stack-tight"],
      "space-y": [
        { "space-y": ["stack-tight", "stack-sm", "stack-md", "stack-lg", "sections", "data-table-stack", "wizard-steps-gap", "wizard-steps-row-gap", "form-item-gap", "card-lines"] },
      ],
      h: ["h-control-height", "h-control-height-sm", "h-control-height-lg", "h-field-separator", "h-skeleton-line", "h-skeleton-title", "h-scrollbar", "h-anchor", "h-frame", "h-logo", "h-logo-row", "h-logo-lg", "h-logo-display", "h-brand", "h-share", "h-phone-bar"],
      w: ["w-skeleton-short", "w-skeleton-bar", "w-skeleton-third", "w-skeleton-body", "w-skeleton-label", "w-skeleton-note", "w-skeleton-half", "w-skeleton-wide", "w-sidebar-compact", "w-invite", "w-handle", "w-name", "w-area", "w-status", "w-look", "w-mode", "w-preview", "w-panel"],
      "grid-cols": ["grid-pair", "grid-trio", "grid-quad"],
      "col-start": ["col-start-first", "col-start-next"],
      "col-start-end": ["span-rest"],
      "row-start": ["row-start-first"],
      size: [{ size: ["icon"] }, "size-icon-sm", "size-icon-lg", "size-mini", "size-mark", "size-person", "size-pip", "size-control-height-sm", "size-checkbox", "size-status-label-box", "size-status-dot"],
      py: ["flush-block", "py-control-block", "py-control-block-lg", "py-alert-block", "py-detail-panel-block", "py-select-item-block", "py-table-cell", "py-badge-block", "py-section-sm", "py-section-md", "py-section-lg", "py-section-xl", "empty-state-block", "surface-pad-block", "surface-pad-block-sm", "py-row", "py-cta", "py-bar", "py-index"],
      p: ["flush", "p-drawer-chrome-padding", "p-app-shell-padding", "p-table-cell", "p-option-card-padding", "p-field-label-inset", "p-select-separator", "surface-pad-sm", "surface-pad-compact", "surface-pad-md", "surface-pad-lg", "pad-row", "glass-pad-lg", "p-track", "p-segment"],
      px: ["px-page-gutter", "px-field-pad", "px-button-pad", "px-button-pad-lg", "px-button-inline-sm", "px-alert-inline", "px-detail-panel-inline", "px-drawer-chrome-padding", "px-table-cell", "px-select-item-inline", "px-tabs-trigger-inline", "px-field-separator-inline", "px-control-inline", "px-control-tight", "px-touch", "px-cta", "px-meta", "px-tab", "px-flush", "surface-pad-inline"],
      pl: ["pl-select-item-inline", "pl-control-inline", "pl-list", "pl-chip"],
      pr: ["trim-pad-end", "pr-column", "pr-chip", "pr-chip-end"],
      pt: ["pt-drawer-chrome-padding", "actions-offset", "content-offset", "pt-start", "pt-footer-note", "pt-step", "trim-pad-top"],
      mt: ["trim-top", "icon-nudge", "icon-nudge-sm", "mt-status", "mt-standfirst", "mt-check", "pull-line", "pull-legend", "pull-back", "mt-figure", "mt-drawer-handle-top", "mt-table-caption-gap", "mt-tabs-content-gap", "mt-card-section"],
      mb: ["mb-drawer-handle-top", "mb-field-legend-bottom", "mb-stack", "mb-lead", "mb-alert-title", "pull-outline", "trim-bottom"],
      my: ["pull-separator", "my-table"],
      ml: ["ml-field-error-indent", "ml-note"],
      pb: ["rule-gap", "pb-sheet", "pb-answer", "pb-section", "pb-block", "trim-pad-bottom"],
      top: ["pin-top", "pin-center-y", "pin-middle", "top-control-inline", "top-caption", "top-float", "top-editor", "top-bar", "top-alert-icon-offset"],
      "space-x": ["space-x-faces"],
      "max-h": ["max-h-secret", "max-h-log"],
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
