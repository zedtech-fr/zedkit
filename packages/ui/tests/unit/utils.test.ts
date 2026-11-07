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
    expect(cn("grid-cols-3", "grid-pair")).toBe("grid-pair");
    expect(cn("grid-pair", "grid-trio")).toBe("grid-trio");
  });
});
