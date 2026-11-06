import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";

/** Key phrases of the consume-don't-copy audit check, in order. */
const PHRASES = [
  "copied shared config",
  "published `@zedtech/*` package ships",
  "replace the copy with the install",
  "never copy-paste",
];

describe("setup-ai propagation", () => {
  it("audits local copies of published zedkit configs", () => {
    const raw = readFileSync(join(kitDir(), "skills", "setup-ai", "SKILL.md"), "utf8");
    const text = raw.replace(/\s+/g, " ").toLowerCase();
    let from = 0;
    for (const phrase of PHRASES) {
      const at = text.indexOf(phrase, from);
      expect(at, `missing phrase: ${phrase}`).toBeGreaterThanOrEqual(0);
      from = at + phrase.length;
    }
  });

  it("verifies the repo lint ignores the installed kit dirs", () => {
    const raw = readFileSync(join(kitDir(), "skills", "setup-ai", "SKILL.md"), "utf8");
    const text = raw.replace(/\s+/g, " ").toLowerCase();
    expect(text).toContain("lint ignores the installed kit dirs");
    expect(text).toContain("skills ship helper scripts");
  });
});
