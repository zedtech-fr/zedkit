import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";
import { skillDirs } from "./helpers.js";

describe("companion references", () => {
  it("names every sibling doc in its SKILL.md or the notices", () => {
    const notices = readFileSync(join(kitDir(), "THIRD_PARTY_NOTICES.md"), "utf8");
    let checked = 0;
    for (const skill of skillDirs()) {
      const dir = join(kitDir(), "skills", skill);
      const body = readFileSync(join(dir, "SKILL.md"), "utf8");
      const siblings = readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "SKILL.md");
      for (const file of siblings) {
        checked += 1;
        const stem = file.replace(/\.md$/, "");
        const named = body.includes(file) || body.includes(stem) || notices.includes(`${skill}/${file}`);
        expect(named, `${skill}/${file} unreferenced`).toBe(true);
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});
