import { describe, expect, it } from "vitest";
import { cn } from "#index.js";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("lets the last conflicting Tailwind utility win", () => {
    expect(cn("px-stack-lg", "px-stack-sm")).toBe("px-stack-sm");
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
    expect(cn("text-sm font-medium", "px-stack-lg")).toBe("text-sm font-medium px-stack-lg");
  });

  it("merges role spacing with the default scale", () => {
    expect(cn("gap-stack-sm", "gap-stack-sm")).toBe("gap-stack-sm");
    expect(cn("gap-stack-sm", "gap-stack-lg")).toBe("gap-stack-lg");
    expect(cn("px-stack-lg", "px-field-pad")).toBe("px-field-pad");
    expect(cn("px-button-pad", "px-button-pad-lg")).toBe("px-button-pad-lg");
    expect(cn("px-stack-sm", "px-stack-sm")).toBe("px-stack-sm");
    expect(cn("py-stack-sm", "py-stack-sm")).toBe("py-stack-sm");
    expect(cn("space-y-stack-lg", "space-y-stack-lg")).toBe("space-y-stack-lg");
    expect(cn("size-stack-lg", "size-icon")).toBe("size-icon");
    expect(cn("p-stack-lg", "p-stack-lg")).toBe("p-stack-lg");
    expect(cn("min-w-zero", "min-w-zero")).toBe("min-w-zero");
    expect(cn("mt-stack-lg", "-mt-stack-lg")).toBe("-mt-stack-lg");
  });
});
