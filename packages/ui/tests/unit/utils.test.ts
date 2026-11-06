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
});
