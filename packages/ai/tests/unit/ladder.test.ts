import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";

/** One key phrase per rung of the ponytail existence ladder, in order. */
const RUNGS = [
  "need to exist",
  "in this codebase",
  "standard library",
  "native platform feature or a standard tool",
  "installed dependency",
  "one line",
  "minimum code that works",
];

function skillText(name: string): string {
  const raw = readFileSync(join(kitDir(), "skills", name, "SKILL.md"), "utf8");
  return raw.replace(/\s+/g, " ").toLowerCase();
}

/** Position of each rung searching forward, so order is enforced. */
function rungPositions(text: string): number[] {
  let from = 0;
  return RUNGS.map((rung) => {
    const at = text.indexOf(rung, from);
    if (at >= 0) from = at + rung.length;
    return at;
  });
}

describe("ponytail ladder", () => {
  for (const name of ["ponytail-review", "implement", "plan"]) {
    it(`asks the 7 rungs in order in ${name}`, () => {
      expect(rungPositions(skillText(name)).every((at) => at >= 0)).toBe(true);
    });
  }

  it("opens ponytail-review as its first section", () => {
    const raw = readFileSync(
      join(kitDir(), "skills", "ponytail-review", "SKILL.md"),
      "utf8",
    );
    const ladderAt = raw.indexOf("## 1. The ladder");
    expect(ladderAt).toBeGreaterThanOrEqual(0);
    expect(raw.indexOf("## 2. ")).toBeGreaterThan(ladderAt);
  });

  it("is part of code-review's checklist by reference", () => {
    const text = skillText("code-review");
    expect(text).toContain("ladder");
    expect(text).toContain("ponytail-review");
  });
});
