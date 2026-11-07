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
    expect(utility("trim-bottom")).toBe("margin-bottom: 0;");
    expect(utility("trim-pad-top")).toBe("padding-top: 0;");
    expect(utility("icon-nudge")).toBe("margin-top: var(--spacing);");
    expect(utility("gap-flush")).toBe("gap: 0;");
    expect(utility("flush-block")).toBe("padding-block: 0;");
    expect(css).not.toContain("--spacing-zero");
    expect(css).not.toContain("min-w-zero");
  });

  it("names only the shared stack steps, and keeps them on the spacing scale", () => {
    expect(css).toContain("--zk-gap-sm: calc(var(--spacing) * 2);");
    expect(css).toContain("--zk-gap-md: calc(var(--spacing) * 3);");
    expect(css).toContain("--zk-gap-lg: calc(var(--spacing) * 4);");
    expect(utility("gap-stack-tight")).toBe("gap: var(--spacing);");
    expect(utility("gap-icon")).toBe("gap: calc(var(--spacing) * 1.5);");
    expect(utility("gap-y-stack-sm")).toBe("row-gap: var(--zk-gap-sm);");
    expect(utility("gap-x-stack-lg")).toBe("column-gap: var(--zk-gap-lg);");
    expect(utility("gap-y-stack-tight")).toBe("row-gap: var(--spacing);");
    expect(utility("gap-prose")).toBe("gap: calc(var(--spacing) * 5);");
    expect(utility("gap-list")).toBe("gap: calc(var(--spacing) * 6);");
    expect(utility("grid-pair")).toBe("grid-template-columns: repeat(2, minmax(0, 1fr));");
    expect(utility("grid-trio")).toBe("grid-template-columns: repeat(3, minmax(0, 1fr));");
    expect(utility("w-skeleton-short")).toBe("width: 66.666667%;");
    expect(utility("gap-stack-sm")).toBe("gap: var(--zk-gap-sm);");
    expect(utility("gap-section-stack")).toBe("gap: calc(var(--spacing) * 10);");
    expect(utility("actions-offset")).toBe("padding-top: calc(var(--spacing) * 2);");
    expect(utility("surface-pad-sm")).toBe("padding: calc(var(--spacing) * 2);");
    expect(utility("surface-pad-compact")).toBe("padding: calc(var(--spacing) * 3);");
    expect(utility("surface-pad-block")).toBe("padding-block: calc(var(--spacing) * 3);");
    expect(utility("surface-pad-block-sm")).toBe("padding-block: calc(var(--spacing) * 2);");
    expect(utility("rule-gap")).toBe("padding-bottom: calc(var(--spacing) * 2);");
    expect(utility("content-offset")).toBe("padding-top: calc(var(--spacing) * 4);");
    expect(utility("pad-row")).toBe("padding-inline: calc(var(--spacing) * 3); padding-block: calc(var(--spacing) * 2);");
    expect(utility("surface-pad-md")).toBe("padding: calc(var(--spacing) * 4);");
    expect(utility("surface-pad-inline")).toBe("padding-inline: calc(var(--spacing) * 4);");
    expect(utility("px-control-tight")).toBe("padding-inline: calc(var(--spacing) * 2);");
    expect(utility("glass-pad-md")).toBe("padding: calc(var(--spacing) * 6);");
    expect(utility("empty-state-block")).toBe("padding-block: calc(var(--spacing) * 8);");
    expect(utility("h-skeleton-line")).toBe("height: calc(var(--spacing) * 4);");
    expect(utility("h-logo")).toBe("height: calc(var(--spacing) * 6);");
    expect(utility("size-mark")).toBe("width: calc(var(--spacing) * 10); height: calc(var(--spacing) * 10);");
    expect(utility("size-person")).toBe("width: calc(var(--spacing) * 8); height: calc(var(--spacing) * 8);");
    expect(utility("w-skeleton-bar")).toBe("width: calc(var(--spacing) * 24);");
    expect(utility("mt-status")).toBe("margin-top: calc(var(--spacing) * 3);");
    expect(utility("gap-x-meta")).toBe("column-gap: calc(var(--spacing) * 6);");
    expect(utility("min-h-status")).toBe("min-height: calc(var(--spacing) * 6);");
    expect(css).not.toContain("--spacing-stack-6xl");
    expect(css).not.toContain("--zk-gap-2xs");
  });
});
