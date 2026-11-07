import { describe, expect, it } from "vitest";
import { cn } from "#index.js";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("lets the last conflicting Tailwind utility win", () => {
    expect(cn("px-4", "px-2")).toBe("px-2");
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
  });

  it("treats the input font-size token as a font size, not a text color", () => {
    expect(cn("text-control", "text-lg")).toBe("text-lg");
    expect(cn("text-sm", "text-dense")).toBe("text-dense");
    expect(cn("text-xs", "text-caption")).toBe("text-caption");
    expect(cn("text-dense", "text-lg")).toBe("text-lg");
    expect(cn("text-foreground", "text-control")).toBe("text-foreground text-control");
  });

  it("treats spacing-token min-heights as one conflict group", () => {
    expect(cn("min-h-textarea-min-height", "min-h-control-height")).toBe("min-h-control-height");
  });

  it("keeps non-conflicting utilities from every input", () => {
    expect(cn("text-sm font-medium", "px-4")).toBe("text-sm font-medium px-4");
  });

  it("merges a role class with the numeric step it replaces", () => {
    expect(cn("gap-2", "gap-stack-sm")).toBe("gap-stack-sm");
    expect(cn("gap-stack-sm", "gap-stack-lg")).toBe("gap-stack-lg");
    expect(cn("px-4", "px-field-pad")).toBe("px-field-pad");
    expect(cn("px-button-pad", "px-button-pad-lg")).toBe("px-button-pad-lg");
    expect(cn("py-2", "py-control-block-lg")).toBe("py-control-block-lg");
    expect(cn("h-9", "h-control-height")).toBe("h-control-height");
    expect(cn("space-y-4", "space-y-stack-lg")).toBe("space-y-stack-lg");
    expect(cn("size-4", "size-icon")).toBe("size-icon");
    expect(cn("min-w-0", "content-shrink")).toBe("content-shrink");
    expect(cn("min-h-11", "min-h-target")).toBe("min-h-target");
    expect(cn("content-shrink", "min-w-full")).toBe("min-w-full");
    expect(cn("top-0", "pin-top")).toBe("pin-top");
    expect(cn("inset-0", "pin-fill")).toBe("pin-fill");
    expect(cn("p-4", "flush")).toBe("flush");
    expect(cn("size-8", "size-person")).toBe("size-person");
    expect(cn("size-person", "size-mark")).toBe("size-mark");
    expect(cn("size-8", "size-control-height-sm")).toBe("size-control-height-sm");
    expect(cn("w-24", "w-skeleton-bar")).toBe("w-skeleton-bar");
    expect(cn("mt-3", "mt-status")).toBe("mt-status");
    expect(cn("gap-x-6", "gap-x-meta")).toBe("gap-x-meta");
    expect(cn("gap-8", "gap-blocks")).toBe("gap-blocks");
    expect(cn("gap-blocks", "gap-list")).toBe("gap-list");
    expect(cn("mt-2", "mt-standfirst")).toBe("mt-standfirst");
    expect(cn("px-2", "px-control-tight")).toBe("px-control-tight");
    expect(cn("space-y-1", "space-y-stack-tight")).toBe("space-y-stack-tight");
    expect(cn("w-48", "w-sidebar-compact")).toBe("w-sidebar-compact");
    expect(cn("h-14", "h-phone-bar")).toBe("h-phone-bar");
    expect(cn("h-8", "h-logo-row")).toBe("h-logo-row");
    expect(cn("min-h-5", "min-h-label")).toBe("min-h-label");
    expect(cn("col-span-2", "span-rest")).toBe("span-rest");
    expect(cn("gap-x-8", "gap-x-blocks")).toBe("gap-x-blocks");
    expect(cn("pb-6", "pb-sheet")).toBe("pb-sheet");
    expect(cn("pl-4", "pl-list")).toBe("pl-list");
    expect(cn("px-1", "px-touch")).toBe("px-touch");
    expect(cn("size-1.5", "size-pip")).toBe("size-pip");
    expect(cn("py-0.5", "py-badge-block")).toBe("py-badge-block");
    expect(cn("pr-0", "trim-pad-end")).toBe("trim-pad-end");
    expect(cn("top-1/2", "pin-center-y")).toBe("pin-center-y");
    expect(cn("mt-0.5", "icon-nudge-sm")).toBe("icon-nudge-sm");
    expect(cn("gap-0.5", "gap-segment")).toBe("gap-segment");
    expect(cn("-mx-2", "-mx-back")).toBe("-mx-back");
    expect(cn("basis-28", "basis-field")).toBe("basis-field");
    expect(cn("mb-3", "mb-field-legend-bottom")).toBe("mb-field-legend-bottom");
    expect(cn("right-3", "right-control-inline")).toBe("right-control-inline");
    expect(cn("top-3", "top-control-inline")).toBe("top-control-inline");
    expect(cn("bottom-3", "bottom-control-inline")).toBe("bottom-control-inline");
    expect(cn("pr-4", "pr-column")).toBe("pr-column");
    expect(cn("mb-2", "mb-stack")).toBe("mb-stack");
    expect(cn("row-start-1", "row-start-first")).toBe("row-start-first");
    expect(cn("px-3", "px-control-inline")).toBe("px-control-inline");
    expect(cn("py-1.5", "py-select-item-block")).toBe("py-select-item-block");
    expect(cn("py-4", "py-row")).toBe("py-row");
    expect(cn("pt-3", "pt-start")).toBe("pt-start");
    expect(cn("basis-32", "basis-number")).toBe("basis-number");
    expect(cn("basis-40", "basis-text")).toBe("basis-text");
    expect(cn("h-5", "h-brand")).toBe("h-brand");
    expect(cn("size-5", "size-icon-lg")).toBe("size-icon-lg");
    expect(cn("min-h-14", "min-h-phone-bar")).toBe("min-h-phone-bar");
    expect(cn("gap-y-4", "gap-y-stack-lg")).toBe("gap-y-stack-lg");
    expect(cn("gap-x-10", "gap-x-logos")).toBe("gap-x-logos");
    expect(cn("gap-16", "gap-scenes")).toBe("gap-scenes");
    expect(cn("px-12", "px-cta")).toBe("px-cta");
    expect(cn("py-12", "py-cta")).toBe("py-cta");
    expect(cn("pb-4", "pb-answer")).toBe("pb-answer");
    expect(cn("pt-6", "pt-footer-note")).toBe("pt-footer-note");
    expect(cn("px-0.5", "px-meta")).toBe("px-meta");
    expect(cn("pr-1", "pr-chip")).toBe("pr-chip");
    expect(cn("mb-1", "mb-alert-title")).toBe("mb-alert-title");
    expect(cn("ml-2", "ml-note")).toBe("ml-note");
    expect(cn("right-1.5", "right-send")).toBe("right-send");
    expect(cn("bottom-1.5", "bottom-send")).toBe("bottom-send");
    expect(cn("top-24", "top-caption")).toBe("top-caption");
    expect(cn("max-h-64", "max-h-secret")).toBe("max-h-secret");
    expect(cn("basis-48", "basis-tile")).toBe("basis-tile");
    expect(cn("pt-4", "content-offset")).toBe("content-offset");
    expect(cn("py-3", "surface-pad-block")).toBe("surface-pad-block");
    expect(cn("grid-cols-3", "grid-pair")).toBe("grid-pair");
    expect(cn("grid-pair", "grid-trio")).toBe("grid-trio");
  });
});
