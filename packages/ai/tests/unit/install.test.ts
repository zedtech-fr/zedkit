import { existsSync, lstatSync, mkdirSync, readFileSync, readlinkSync, readdirSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { installKit } from "#install.js";
import { readManifest } from "#kit.js";
import { validateKit } from "#validate.js";
import { put, tempDir } from "./helpers.js";

function install(dest: string, options: Parameters<typeof installKit>[0] extends infer O ? Partial<O> : never = {}) {
  const result = installKit({ dest, ...options });
  if (!result.ok) throw result.error;
  return result.value;
}

describe("installKit", () => {
  it("installs the core preset and wires both tools", () => {
    const dest = tempDir();
    install(dest);
    expect(existsSync(join(dest, "AGENTS.md"))).toBe(true);
    expect(existsSync(join(dest, ".agents/skills/ground-truth/SKILL.md"))).toBe(true);
    expect(existsSync(join(dest, ".agents/skills/LICENSE-ponytail-MIT"))).toBe(true);
    expect(existsSync(join(dest, ".agents/THIRD_PARTY_NOTICES.md"))).toBe(true);
    expect(existsSync(join(dest, ".agents/agents/verifier.md"))).toBe(true);
    // Symlinks resolve through to real files.
    expect(readlinkSync(join(dest, ".claude/skills"))).toBe("../.agents/skills");
    expect(existsSync(join(dest, ".claude/skills/ground-truth/SKILL.md"))).toBe(true);
    expect(existsSync(join(dest, ".claude/agents/verifier.md"))).toBe(true);
    expect(existsSync(join(dest, ".cursor/skills/ground-truth/SKILL.md"))).toBe(true);
    expect(existsSync(join(dest, ".cursor/agents/verifier.md"))).toBe(true);
    expect(readlinkSync(join(dest, "CLAUDE.md"))).toBe("AGENTS.md");
    expect(readFileSync(join(dest, ".cursor/rules/project.mdc"), "utf8")).toContain("alwaysApply: true");
  });

  it("copies only the preset's skills, and the full preset copies all", () => {
    const core = tempDir();
    install(core);
    expect(existsSync(join(core, ".agents/skills/triage"))).toBe(false);
    const full = tempDir();
    install(full, { preset: "full" });
    expect(existsSync(join(full, ".agents/skills/triage/SKILL.md"))).toBe(true);
  });

  it("produces output that passes validation", () => {
    const dest = tempDir();
    install(dest, { preset: "full" });
    expect(validateKit(join(dest, ".agents"))).toEqual([]);
  });

  it("never overwrites: a second run only skips, and local edits survive", () => {
    const dest = tempDir();
    install(dest);
    writeFileSync(join(dest, "AGENTS.md"), "mine\n");
    writeFileSync(join(dest, ".agents/skills/ground-truth/SKILL.md"), "edited\n");
    const again = install(dest);
    expect(again.every((a) => a.kind === "skip")).toBe(true);
    expect(readFileSync(join(dest, "AGENTS.md"), "utf8")).toBe("mine\n");
    expect(readFileSync(join(dest, ".agents/skills/ground-truth/SKILL.md"), "utf8")).toBe("edited\n");
  });

  it("keeps a pre-existing real folder instead of replacing it with a link", () => {
    const dest = tempDir();
    put(dest, ".claude/skills/own/SKILL.md", "own\n");
    const actions = install(dest);
    expect(lstatSync(join(dest, ".claude/skills")).isSymbolicLink()).toBe(false);
    expect(actions.find((a) => a.path === ".claude/skills")?.kind).toBe("skip");
  });

  it("writes nothing on a dry run", () => {
    const dest = tempDir();
    const actions = install(dest, { dryRun: true });
    expect(actions.length).toBeGreaterThan(0);
    expect(readdirSync(dest)).toEqual([]);
  });

  it("wires only the requested targets", () => {
    const dest = tempDir();
    install(dest, { targets: ["claude"] });
    expect(existsSync(join(dest, ".claude"))).toBe(true);
    expect(existsSync(join(dest, ".cursor"))).toBe(false);
  });

  it("returns an error for an unknown preset and writes no skills", () => {
    const dest = tempDir();
    const result = installKit({ dest, preset: "nope" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('unknown preset "nope"');
    expect(existsSync(join(dest, ".agents/skills"))).toBe(false);
  });

  it("returns an error when the kit manifest lists a missing skill", () => {
    const kit = tempDir();
    put(kit, "kit.json", JSON.stringify({ presets: { core: ["ghost"] }, agents: [] }));
    put(kit, "skills/alpha/SKILL.md", "x");
    const result = installKit({ dest: tempDir(), kit });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('no skill "ghost"');
  });

  it("fails before writing anything when a later skill is missing from the kit", () => {
    const kit = tempDir();
    put(kit, "kit.json", JSON.stringify({ presets: { core: ["alpha", "ghost"] }, agents: [] }));
    put(kit, "skills/alpha/SKILL.md", "x");
    put(kit, "AGENTS.template.md", "t");
    put(kit, "THIRD_PARTY_NOTICES.md", "n");
    const dest = tempDir();
    expect(installKit({ dest, kit }).ok).toBe(false);
    expect(readdirSync(dest)).toEqual([]);
  });

  it("rejects prototype keys as presets", () => {
    for (const preset of ["constructor", "__proto__", "toString"]) {
      const result = installKit({ dest: tempDir(), preset });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.message).toContain("unknown preset");
    }
  });

  it("skips (instead of crashing) when a parent path is a file, in dry run and for real", () => {
    for (const dryRun of [true, false]) {
      const dest = tempDir();
      writeFileSync(join(dest, ".cursor"), "i am a file\n");
      const actions = install(dest, { dryRun });
      const rule = actions.find((a) => a.path === ".cursor/rules/project.mdc");
      expect(rule?.kind, `dryRun=${dryRun}`).toBe("skip");
      expect(rule?.note).toContain("not a directory");
      expect(readFileSync(join(dest, ".cursor"), "utf8")).toBe("i am a file\n");
    }
  });

  it("skips when a dangling symlink is in the way", () => {
    const dest = tempDir();
    mkdirSync(join(dest, ".agents"));
    symlinkSync("/definitely/not/here", join(dest, ".agents/skills"));
    const actions = install(dest);
    expect(actions.find((a) => a.path === ".agents/skills/ground-truth")?.kind).toBe("skip");
    expect(readlinkSync(join(dest, ".agents/skills"))).toBe("/definitely/not/here");
  });

  it("does not create a dangling CLAUDE.md when AGENTS.md is a directory", () => {
    const dest = tempDir();
    mkdirSync(join(dest, "AGENTS.md"));
    const actions = install(dest);
    expect(actions.find((a) => a.path === "CLAUDE.md")?.kind).toBe("skip");
    expect(existsSync(join(dest, "CLAUDE.md"))).toBe(false);
  });

  it("skips project.mdc when another always-on rule exists, in dry run and for real", () => {
    for (const dryRun of [true, false]) {
      const dest = tempDir();
      put(dest, ".cursor/rules/own.mdc", "---\ndescription: mine\nalwaysApply: true\n---\n\nMine.\n");
      const actions = install(dest, { dryRun });
      const rule = actions.find((a) => a.path === join(".cursor", "rules", "project.mdc"));
      expect(rule?.kind, `dryRun=${dryRun}`).toBe("skip");
      expect(rule?.note).toContain("own.mdc");
      expect(existsSync(join(dest, ".cursor/rules/project.mdc"))).toBe(false);
      // The rest of the install still happens.
      expect(existsSync(join(dest, ".cursor/skills")) || dryRun).toBe(true);
    }
  });

  it("skips project.mdc when AGENTS.md already exists and an always-on rule references it", () => {
    const dest = tempDir();
    put(dest, "AGENTS.md", "mine\n");
    put(dest, ".cursor/rules/own.mdc", "---\nalwaysApply: true\n---\n\nRead /AGENTS.md.\n");
    const actions = install(dest);
    expect(actions.find((a) => a.path === join(".cursor", "rules", "project.mdc"))?.kind).toBe("skip");
    expect(existsSync(join(dest, ".cursor/rules/project.mdc"))).toBe(false);
  });

  it("still writes project.mdc when the other rules are not always on", () => {
    const dest = tempDir();
    put(dest, ".cursor/rules/manual.mdc", "---\nalwaysApply: false\n---\n\nManual.\n");
    put(dest, ".cursor/rules/plain.mdc", "no frontmatter\n");
    install(dest);
    expect(readFileSync(join(dest, ".cursor/rules/project.mdc"), "utf8")).toContain("alwaysApply: true");
  });

  it("links CLAUDE.md to an AGENTS.md the project already had", () => {
    const dest = tempDir();
    writeFileSync(join(dest, "AGENTS.md"), "mine\n");
    install(dest);
    expect(readFileSync(join(dest, "CLAUDE.md"), "utf8")).toBe("mine\n");
  });

  it("dry run reports the same actions as the real run", () => {
    const planned = install(tempDir(), { dryRun: true });
    const done = install(tempDir());
    expect(planned).toEqual(done);
  });

  it("keeps orchestrator skills short: they reference siblings, never copy them", () => {
    for (const name of ["review", "plan", "challenge"]) {
      const file = join(kitRoot(), "skills", name, "SKILL.md");
      const lines = readFileSync(file, "utf8").split("\n").length;
      expect(lines, `${name} is ${lines} lines`).toBeLessThan(60);
    }
  });

  it("keeps the first-party content closed over the core preset: it only names skills and agents that core installs", () => {
    const dest = tempDir();
    install(dest);
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const installed = new Set(readdirSync(join(dest, ".agents/skills")).concat(manifest.value.agents));
    const everything = new Set(readdirSync(join(kitRoot(), "skills")).concat(manifest.value.agents));
    // Vendored skills are upstream's text; the rest is ours and must hold together.
    const ours = FIRST_PARTY_SKILLS.map((name) => join(dest, ".agents/skills", name, "SKILL.md"));
    const files = [join(dest, "AGENTS.md"), ...markdownFiles(join(dest, ".agents/agents")), ...ours.filter(existsSync)];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      for (const name of everything) {
        const referenced = new RegExp("(`|\"|/)" + name + "(`|\"|\\b)").test(text);
        if (referenced) expect(installed.has(name), `${file} references ${name}`).toBe(true);
      }
    }
  });
});

const FIRST_PARTY_SKILLS = [
  "ground-truth",
  "parallel-work",
  "definition-of-done",
  "adversarial-tests",
  "rules-upkeep",
  "persona-review",
  "setup-ai",
  "review",
  "plan",
  "challenge",
];

function kitRoot(): string {
  return fileURLToPath(new URL("../../kit/", import.meta.url));
}

function markdownFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .map((entry) => join(dir, entry))
    .filter((full) => full.endsWith(".md") && !lstatSync(full).isSymbolicLink() && lstatSync(full).isFile());
}
