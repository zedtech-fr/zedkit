import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";

/** Key phrases of the miss-to-rule step, in order. */
const PHRASES = [
  "every miss becomes a rule",
  "lint rule, a test, or an agents.md line",
  "file it or add it",
];

function reviewText(): string {
  const raw = readFileSync(join(kitDir(), "skills", "review", "SKILL.md"), "utf8");
  return raw.replace(/\s+/g, " ").toLowerCase();
}

describe("miss-to-rule", () => {
  it("asks every review to turn misses into rules, in order", () => {
    const text = reviewText();
    let from = 0;
    for (const phrase of PHRASES) {
      const at = text.indexOf(phrase, from);
      expect(at).toBeGreaterThanOrEqual(0);
      from = at + phrase.length;
    }
  });

  it("is referenced by the audit loop", () => {
    const raw = readFileSync(join(kitDir(), "skills", "audit", "SKILL.md"), "utf8");
    expect(raw.toLowerCase()).toContain("miss-to-rule");
  });
});
