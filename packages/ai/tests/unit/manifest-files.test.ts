import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir, readManifest } from "#kit.js";
import { skillDirs } from "./helpers.js";

describe("manifest files", () => {
  it("lists every agent and command file in the manifest", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const dirs = [
      ["agents", manifest.value.agents],
      ["commands", manifest.value.commands ?? []],
    ] as const;
    for (const [dir, listed] of dirs) {
      const entries = readdirSync(join(kitDir(), dir));
      expect(
        entries.filter((entry) => !entry.endsWith(".md")),
        `${dir} non-markdown entries`,
      ).toEqual([]);
      const strays = entries
        .map((entry) => entry.replace(/\.md$/, ""))
        .filter((name) => !listed.includes(name));
      expect(strays, `${dir} files missing from manifest`).toEqual([]);
    }
  });

  it("carries no unknown top-level keys (typos stay loud)", () => {
    const raw = JSON.parse(readFileSync(join(kitDir(), "kit.json"), "utf8")) as Record<
      string,
      unknown
    >;
    expect(Object.keys(raw).sort()).toEqual(["agents", "commands", "presets"]);
  });

  it("keeps the shipped set above its floors (38 skills, 18 agents, 10 commands)", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    // Floors, not exact counts: growth stays green, removals fail loudly.
    expect(skillDirs().length).toBeGreaterThanOrEqual(38);
    expect(manifest.value.agents.length).toBeGreaterThanOrEqual(18);
    expect(manifest.value.commands?.length ?? 0).toBeGreaterThanOrEqual(10);
  });
});
