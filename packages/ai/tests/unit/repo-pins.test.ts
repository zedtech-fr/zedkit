import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Bounded executable coverage for IMPL-04 (rule: `.agents/atlas.md`, Reference durability). This file covers exactly
// the references the repair touched — no bulk migration. Anchors resolve without line numbers, so harmless movement
// passes; bare lines assert their current content, so a move fails loudly and promotes the pin to an anchor.

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const linesOf = (rel: string): string[] => readFileSync(join(root, rel), "utf8").split("\n");

describe("durable domain and design references", () => {
  it("resolves the A-02 anchor without line numbers", () => {
    const src = readFileSync(join(root, "packages/ai/src/validate.ts"), "utf8");
    const symIdx = src.indexOf("checkNoHeaderKeys");
    expect(symIdx, "anchor symbol").toBeGreaterThan(-1);
    expect(
      src.indexOf('model must be omitted or "inherit"', symIdx),
      "anchor excerpt after the symbol",
    ).toBeGreaterThan(symIdx);
  });

  it.each([
    ["packages/ui/src/identities/glass.css", 28, "--background: 220 60% 97%"],
    ["packages/ui/src/identities/glass.css", 29, "--foreground: 224 45% 12%"],
    ["packages/ui/src/identities/glass.css", 34, "--primary: 243 70% 46%"],
    ["packages/ui/src/identities/glass.css", 40, "--accent: 262 85% 70%"],
    ["packages/ui/src/identities/glass.css", 59, '--zk-font-sans: "Inter Variable"'],
    ["packages/ui/src/identities/glass.css", 60, '--zk-font-display: "Space Grotesk Variable"'],
    ["packages/ui/src/identities/glass.css", 61, '--zk-font-mono: "JetBrains Mono Variable"'],
    ["packages/ui/src/styles.css", 44, "--primary: 240 5.9% 10%"],
    ["packages/ui/src/styles.css", 50, "--accent: 240 4.8% 59.9%"],
    ["packages/ui/src/identities.css", 35, "--zk-font-sans: ui-sans-serif"],
    ["packages/ui/src/identities.css", 37, "--zk-font-mono: ui-monospace"],
  ] as const)("pin %s:%s still names %s", (path, line, token) => {
    expect(linesOf(path)[line - 1], `${path}:${line}`).toContain(token);
  });

  it("keeps a verification commit on the design token table", () => {
    expect(readFileSync(join(root, ".agents/design.md"), "utf8")).toMatch(/verified against `[0-9a-f]{7,40}`/);
  });
});
