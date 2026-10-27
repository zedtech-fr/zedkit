import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { kitDir, readManifest } from "#kit.js";

function readmeCommands(): string[] {
  const readme = readFileSync(fileURLToPath(new URL("../../README.md", import.meta.url)), "utf8");
  const block = /^Commands \(([\s\S]*?)\) are 3-6 line files/m.exec(readme);
  expect(block, "README commands list").not.toBeNull();
  return [...(block?.[1] ?? "").matchAll(/`([a-z][a-z0-9-]*)`/g)].map((m) => m[1] ?? "");
}

describe("package README", () => {
  it("lists exactly the manifest commands, in order", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    expect(readmeCommands()).toEqual(manifest.value.commands ?? []);
  });

  it("keeps every command file within the claimed 3-6 lines", () => {
    const files = readdirSync(`${kitDir()}/commands`).filter((f) => f.endsWith(".md"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const lines = readFileSync(`${kitDir()}/commands/${file}`, "utf8").split("\n").length;
      expect(lines, file).toBeGreaterThanOrEqual(3);
      expect(lines, file).toBeLessThanOrEqual(7);
    }
  });

  it("names only shipped skills, agents, commands or presets in Entry points", () => {
    const readme = readFileSync(fileURLToPath(new URL("../../README.md", import.meta.url)), "utf8");
    const at = readme.indexOf("**Entry points");
    expect(at, "entry points paragraph").toBeGreaterThanOrEqual(0);
    const paragraph = readme.slice(at, readme.indexOf("\n\n", at));
    const names = [...new Set([...paragraph.matchAll(/`([a-z][a-z0-9-]*)`/g)].map((m) => m[1] ?? ""))];
    expect(names.length).toBeGreaterThan(0);
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const skills = readdirSync(`${kitDir()}/skills`);
    const known = new Set(
      manifest.value.agents.concat(
        manifest.value.commands ?? [],
        skills,
        Object.keys(manifest.value.presets),
      ),
    );
    for (const name of names) {
      expect([...known], `entry point ${name}`).toContain(name);
    }
  });
});
