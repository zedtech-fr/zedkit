import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../src/styles.css"), "utf8");

function utility(name: string): string {
  const match = css.match(new RegExp(`@utility ${name} \\{([^}]+)\\}`));
  return match?.[1]?.replace(/\s+/g, " ").trim() ?? "";
}

describe("layout job classes", () => {
  it("keeps the shrink and pin constraints as literals under a job name", () => {
    expect(utility("content-shrink")).toBe("min-width: 0;");
    expect(utility("min-h-target")).toBe("min-height: max(var(--zk-tap-min, 0px), calc(var(--spacing) * 11));");
    expect(utility("min-w-target")).toBe("min-width: max(var(--zk-tap-min, 0px), calc(var(--spacing) * 11));");
    expect(utility("pane-shrink")).toBe("min-height: 0;");
    expect(utility("pin-fill")).toBe("inset: 0;");
    expect(utility("pin-top")).toBe("top: 0;");
    expect(utility("pin-x")).toBe("inset-inline: 0;");
    expect(utility("flush")).toBe("padding: 0;");
    expect(utility("flush-block")).toBe("padding-block: 0;");
    expect(css).not.toContain("--spacing-zero");
    expect(css).not.toContain("min-w-zero");
  });

  it("names only the shared stack steps, and keeps them on the spacing scale", () => {
    expect(css).toContain("--zk-gap-sm: calc(var(--spacing) * 2);");
    expect(css).toContain("--zk-gap-md: calc(var(--spacing) * 3);");
    expect(css).toContain("--zk-gap-lg: calc(var(--spacing) * 4);");
    expect(utility("gap-stack-sm")).toBe("gap: var(--zk-gap-sm);");
    expect(utility("surface-pad-sm")).toBe("padding: calc(var(--spacing) * 2);");
    expect(utility("surface-pad-md")).toBe("padding: calc(var(--spacing) * 4);");
    expect(utility("glass-pad-md")).toBe("padding: calc(var(--spacing) * 6);");
    expect(utility("empty-state-block")).toBe("padding-block: calc(var(--spacing) * 8);");
    expect(css).not.toContain("--spacing-stack-6xl");
    expect(css).not.toContain("--zk-gap-2xs");
  });
});
