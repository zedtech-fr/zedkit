import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";

describe("third-party notices", () => {
  it("names every shipped skill (first-party list or upstream section)", () => {
    const notices = readFileSync(`${kitDir()}/THIRD_PARTY_NOTICES.md`, "utf8");
    const skills = readdirSync(`${kitDir()}/skills`, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    expect(skills.length).toBeGreaterThan(0);
    for (const skill of skills) {
      expect(notices, skill).toContain(`\`${skill}\``);
    }
  });
});
