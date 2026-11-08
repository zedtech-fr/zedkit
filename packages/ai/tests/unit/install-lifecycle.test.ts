// Original work by the same author.
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main } from "#cli.js";
import { resolveConditionals } from "#conditional.js";
import { agentsForPreset, commandsForPreset, kitDir, kitUniverse, readManifest } from "#kit.js";
import { readLegacyHashFile, shortHash } from "#legacy.js";
import { validateKit } from "#validate.js";
import { tempDir } from "./helpers.js";

function setup(dest: string, providers: string[]): void {
  const code = main(["setup", dest, "--provider", providers.join(",")], {
    out: () => {},
    err: () => {},
  });
  if (code !== 0) throw new Error(`setup failed with code ${code}`);
}

function tree(dest: string): string[] {
  const found: string[] = [];
  const walk = (dir: string, base: string): void => {
    for (const entry of readdirSync(join(dest, dir), { withFileTypes: true })) {
      const rel = base === "" ? entry.name : `${base}/${entry.name}`;
      if (entry.isDirectory()) walk(join(dir, entry.name), rel);
      else if (entry.isFile()) found.push(rel);
    }
  };
  walk("", "");
  return found.sort();
}

describe("install lifecycle: reruns and upgrades converge", () => {
  it("re-running setup on an untouched install writes no sidecars (D4)", () => {
    const dest = tempDir();
    setup(dest, ["cursor", "muse"]);
    const before = tree(dest);
    expect(before.length).toBeGreaterThan(0);

    setup(dest, ["cursor", "muse"]);

    const sidecars = tree(dest).filter((f) => f.endsWith(".kit.md") || f.includes("/zk-"));
    expect(sidecars).toEqual([]);
    expect(tree(dest)).toEqual(before);
  });

  it("an old skill install missing a new asset converges instead of sidecarring (R1)", () => {
    const dest = tempDir();
    setup(dest, ["cursor"]);
    // Simulate a 1.0.0-era setup-ai dir: current SKILL.md, templates present,
    // but the design-policy.md asset the new kit added is missing.
    const skill = join(dest, ".agents", "skills", "setup-ai");
    expect(existsSync(join(kitDir(), "skills", "setup-ai", "design-policy.md"))).toBe(true);
    rmSync(join(skill, "design-policy.md"), { force: true });

    setup(dest, ["cursor"]);

    expect(existsSync(join(skill, "design-policy.md"))).toBe(true);
    expect(existsSync(join(dest, ".agents", "skills", "zk-setup-ai"))).toBe(false);
    expect(validateKit(join(dest, ".agents"))).toEqual([]);
  });

  it("a recorded prior version of a skill updates in place (D2)", () => {
    const kit = kitDir();
    const manifest = readManifest(kit);
    if (!manifest.ok) throw manifest.error;
    const universe = kitUniverse(kit);
    const availFor = (preset: string): { skills: Set<string>; agents: Set<string>; commands: Set<string> } => {
      const entry = manifest.value.presets[preset];
      return {
        skills: new Set(entry === "*" ? universe.skills : entry),
        agents: new Set(agentsForPreset(manifest.value, preset)),
        commands: new Set(commandsForPreset(manifest.value, preset)),
      };
    };
    // setup-ai SKILL.md resolves differently per preset; the generator records
    // every per-preset variant, so the starter resolution is a known prior shape.
    const raw = readFileSync(join(kit, "skills", "setup-ai", "SKILL.md"), "utf8");
    const oldVariant = resolveConditionals(raw, availFor("starter"), universe);
    const installedVariant = resolveConditionals(raw, availFor("setup"), universe);
    expect(oldVariant).not.toBe(installedVariant);
    const recorded = readLegacyHashFile(join(kit, "legacy-hashes.json"));
    expect(recorded.status).toBe("ok");
    if (recorded.status === "ok") {
      expect(recorded.map.skills?.["setup-ai/SKILL.md"] ?? []).toContain(shortHash(oldVariant));
    }

    const dest = tempDir();
    setup(dest, ["cursor", "claude"]);
    // Roll setup-ai back to the recorded prior variant, then re-run setup.
    writeFileSync(join(dest, ".agents", "skills", "setup-ai", "SKILL.md"), oldVariant);

    setup(dest, ["cursor", "claude"]);

    expect(existsSync(join(dest, ".agents", "skills", "zk-setup-ai"))).toBe(false);
    expect(readFileSync(join(dest, ".agents", "skills", "setup-ai", "SKILL.md"), "utf8")).toBe(installedVariant);
  });
});
