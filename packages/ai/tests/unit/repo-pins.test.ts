import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Bounded executable coverage for IMPL-04 (rule: `.agents/atlas.md`, Reference durability). This file covers exactly
// the token pins the repair touched — no bulk migration. Anchors resolve without line numbers, so harmless movement
// passes; bare lines assert their current content, so a move fails loudly and promotes the pin to an anchor.

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const linesOf = (rel: string): string[] => readFileSync(join(root, rel), "utf8").split("\n");

const PINS = [
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
] as const;

describe("durable domain and design references", () => {
  it("resolves the A-02 anchor inside the symbol body", () => {
    const src = readFileSync(join(root, "packages/ai/src/validate.ts"), "utf8");
    expect(src.split("function checkAgent(").length - 1, "anchor symbol unique file-wide").toBe(1);
    const symIdx = src.indexOf("function checkAgent(");
    expect(symIdx, "anchor symbol").toBeGreaterThan(-1);
    const tail = src.slice(symIdx + 1);
    const nextFnRel = tail.search(/\n(?:export\s+)?(?:async\s+)?function\s/);
    const body = nextFnRel === -1 ? src.slice(symIdx) : src.slice(symIdx, symIdx + 1 + nextFnRel);
    const excerpt = 'model must be omitted or "inherit"';
    expect(body, "anchor excerpt in the symbol body").toContain(excerpt);
    expect(body.split(excerpt).length - 1, "anchor excerpt unique in the symbol body").toBe(1);
    expect(body, "agent rule, not the command rule").toContain("pin a model in your project");
  });

  it.each(PINS)("pin %s:%s still names %s", (path, line, token) => {
    const lines = linesOf(path);
    expect(line, `${path}:${line} in range`).toBeLessThanOrEqual(lines.length);
    expect(lines[line - 1], `${path}:${line}`).toContain(token);
  });

  it("covers exactly the design token pins", () => {
    const doc = readFileSync(join(root, ".agents/design.md"), "utf8");
    const raw = doc.match(/packages\/ui\/src\/[^`\s]*?:\d+/g) ?? ([] as string[]);
    const testPins = PINS.map(([path, line]) => `${path}:${line}`).sort();
    // glass.css:40 is cited twice by design (token table + accent-vs-primary prose); any other dup fails.
    const dupes = raw.filter((pin) => raw.indexOf(pin) !== raw.lastIndexOf(pin));
    expect([...new Set(dupes)].sort()).toEqual(["packages/ui/src/identities/glass.css:40"]);
    expect(raw.length, "raw doc pins are the test pins plus the one known dup").toBe(testPins.length + 1);
    expect(testPins).toEqual(Array.from(new Set(raw)).sort());
  });

  it("keeps one verification commit on the domain and design pins", () => {
    const sha = (rel: string): string => {
      const text = readFileSync(join(root, rel), "utf8");
      const markers = text.match(/verified against `([0-9a-f]{7,40})`/g) ?? [];
      expect(markers, `${rel} has exactly one verification commit`).toHaveLength(1);
      const commit = /verified against `([0-9a-f]{7,40})`/.exec(text)?.[1] ?? "";
      expect(commit, `${rel} verification commit`).toMatch(/^[0-9a-f]{7,40}$/);
      return commit;
    };
    const design = sha(".agents/design.md");
    expect(sha(".agents/domain/ai-kit.md")).toBe(design);
    expect(sha(".agents/atlas.md")).toBe(design);
  });
});
