import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";

function kitText(path: string): string {
  return readFileSync(join(kitDir(), path), "utf8").toLowerCase();
}

describe("frontend rules", () => {
  it("keeps the five demo and doc rules in the ui lens", () => {
    const text = kitText("skills/review/lenses.md");
    expect(text).toContain("one demo = one file");
    expect(text).toContain("one shared frame");
    expect(text).toContain("doc pages stay thin");
    expect(text).toContain("zero raw structural html");
    expect(text).toContain("bans bulk imports");
  });
});
