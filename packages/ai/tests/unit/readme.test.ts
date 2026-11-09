import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { kitDir, readManifest } from "#kit.js";
import { shippedNames } from "./helpers.js";

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
    const known = shippedNames(true);
    for (const name of names) {
      expect([...known], `entry point ${name}`).toContain(name);
    }
  });

  it("runs only scripts the package defines", () => {
    const readme = readFileSync(fileURLToPath(new URL("../../README.md", import.meta.url)), "utf8");
    const pkg = JSON.parse(
      readFileSync(fileURLToPath(new URL("../../package.json", import.meta.url)), "utf8"),
    ) as { scripts: Record<string, string> };
    const scripts = [
      ...readme.matchAll(/pnpm --filter @zedtech\/zedkit-ai ([a-z-]+)/gu),
    ].map((m) => m[1] ?? "");
    expect(scripts.length).toBeGreaterThan(0);
    for (const script of scripts) {
      expect(Object.keys(pkg.scripts), `README runs ${script}`).toContain(script);
    }
  });

  it("upgrade notes name the real CLI, sidecars, and measured score", () => {
    const readme = readFileSync(fileURLToPath(new URL("../../README.md", import.meta.url)), "utf8");
    const at = readme.indexOf("## Upgrading from 0.12");
    expect(at, "upgrade section").toBeGreaterThanOrEqual(0);
    const next = readme.indexOf("\n## ", at + 1);
    const section = readme.slice(at, next === -1 ? undefined : next);
    expect(section).toContain("npx @zedtech/zedkit-ai setup");
    expect(section).toContain(".kit.md");
    expect(section).toContain("zk-review");
    expect(section).toContain("validate --setup");
    expect(section).toContain(".agents/setup-log");
    expect(section).toContain("2.25/3");
    expect(section).toContain("composer-2.5");
    expect(section).toContain("simulated owner");
    expect(section).not.toMatch(/\bGA\b/);
    expect(section).not.toMatch(/generally available/i);
  });

  it("pins no kit counts that rot as the kit grows", () => {
    const readme = readFileSync(fileURLToPath(new URL("../../README.md", import.meta.url)), "utf8");
    const counts = [...readme.matchAll(/\b\d+ (subagents|skills|commands|agents)\b/g)].map(
      (m) => m[0],
    );
    expect(counts).toEqual([]);
  });

  it("never claims init --adopt is the same files as setup (D7)", () => {
    const readme = readFileSync(fileURLToPath(new URL("../../README.md", import.meta.url)), "utf8");
    expect(readme).not.toMatch(/same files as setup/i);
    // init defaults to the starter preset, setup to the setup preset.
    expect(readme).toMatch(/init .*starter.*preset/is);
  });

  it("names every setup-minus-starter skill and subagent in the setup preset section", () => {
    const readme = readFileSync(fileURLToPath(new URL("../../README.md", import.meta.url)), "utf8");
    const at = readme.indexOf("**Setup preset (default for `setup`):**");
    expect(at, "setup preset paragraph").toBeGreaterThanOrEqual(0);
    const paragraph = readme.slice(at, readme.indexOf("\n\n", at));
    const named = new Set(
      [...paragraph.matchAll(/`([a-z][a-z0-9-]*)`/g)].map((m) => m[1] ?? ""),
    );
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const skillsOf = (preset: string): Set<string> => {
      const entry = manifest.value.presets[preset];
      return new Set(entry === "*" ? [] : entry);
    };
    const agentsOf = (preset: string): Set<string> =>
      new Set(manifest.value.presetAgents?.[preset] ?? []);
    for (const skill of skillsOf("setup")) {
      if (skillsOf("starter").has(skill)) continue;
      expect(named, `setup skill ${skill} documented`).toContain(skill);
    }
    for (const agent of agentsOf("setup")) {
      if (agentsOf("starter").has(agent)) continue;
      expect(named, `setup subagent ${agent} documented`).toContain(agent);
    }
  });
});
