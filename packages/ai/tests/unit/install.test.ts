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

  it("installs personas.md from the template, keeps an existing one", () => {
    const fresh = tempDir();
    install(fresh);
    const installed = readFileSync(join(fresh, ".agents/personas.md"), "utf8");
    expect(installed).toContain("Lazy end client");
    expect(installed).toContain("Integrating developer");
    expect(installed).toContain("Maintainer / operator");
    expect(installed).toContain("continue where you left off");
    expect(installed).toContain("flaky network");
    const kept = tempDir();
    mkdirSync(join(kept, ".agents"), { recursive: true });
    writeFileSync(join(kept, ".agents/personas.md"), "custom personas");
    const actions = install(kept);
    expect(readFileSync(join(kept, ".agents/personas.md"), "utf8")).toBe("custom personas");
    expect(actions).toContainEqual(
      expect.objectContaining({ kind: "skip", path: join(".agents", "personas.md") }),
    );
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

  it("never overwrites: local edits survive, and a ladder-less AGENTS.md gets the section appended", () => {
    const dest = tempDir();
    install(dest);
    writeFileSync(join(dest, "AGENTS.md"), "mine\n");
    writeFileSync(join(dest, ".agents/skills/ground-truth/SKILL.md"), "edited\n");
    const again = install(dest);
    expect(again.find((a) => a.path === "AGENTS.md")).toEqual({
      kind: "append",
      path: "AGENTS.md",
      note: "ladder section",
    });
    const agents = readFileSync(join(dest, "AGENTS.md"), "utf8");
    expect(agents.startsWith("mine\n")).toBe(true);
    expect(agents).toContain("## Before writing any code");
    expect(again.filter((a) => a.path !== "AGENTS.md").every((a) => a.kind === "skip")).toBe(true);
    expect(readFileSync(join(dest, ".agents/skills/ground-truth/SKILL.md"), "utf8")).toBe("edited\n");
    // Third run: the ladder is there now, so everything skips.
    expect(install(dest).every((a) => a.kind === "skip")).toBe(true);
  });

  it("dry run reports the ladder append without writing it", () => {
    const dest = tempDir();
    put(dest, "AGENTS.md", "mine\n");
    const planned = install(dest, { dryRun: true });
    expect(planned.find((a) => a.path === "AGENTS.md")?.kind).toBe("append");
    expect(readFileSync(join(dest, "AGENTS.md"), "utf8")).toBe("mine\n");
    const done = install(dest);
    expect(done).toEqual(planned);
    expect(readFileSync(join(dest, "AGENTS.md"), "utf8")).toContain("## Before writing any code");
  });

  it("skips AGENTS.md when the ladder is already there", () => {
    const dest = tempDir();
    put(dest, "AGENTS.md", "# Mine\n\nClimb the ladder.\n");
    const actions = install(dest);
    expect(actions.find((a) => a.path === "AGENTS.md")?.kind).toBe("skip");
    expect(readFileSync(join(dest, "AGENTS.md"), "utf8")).toBe("# Mine\n\nClimb the ladder.\n");
  });

  it("skips the append when the kit template has no ladder section", () => {
    const kit = tempDir();
    put(kit, "kit.json", JSON.stringify({ presets: { core: ["alpha"] }, agents: [] }));
    put(kit, "skills/alpha/SKILL.md", "x");
    put(kit, "AGENTS.template.md", "t");
    put(kit, "THIRD_PARTY_NOTICES.md", "n");
    const dest = tempDir();
    put(dest, "AGENTS.md", "mine\n");
    const actions = install(dest, { kit });
    expect(actions.find((a) => a.path === "AGENTS.md")?.kind).toBe("skip");
    expect(readFileSync(join(dest, "AGENTS.md"), "utf8")).toBe("mine\n");
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

  it("wires only the requested providers (--target still works as an alias)", () => {
    const dest = tempDir();
    install(dest, { targets: ["claude"] });
    expect(existsSync(join(dest, ".claude"))).toBe(true);
    expect(existsSync(join(dest, ".cursor"))).toBe(false);
    const cursorOnly = tempDir();
    install(cursorOnly, { providers: ["cursor"] });
    expect(existsSync(join(cursorOnly, ".cursor"))).toBe(true);
    expect(existsSync(join(cursorOnly, ".claude"))).toBe(false);
  });

  it("links commands for claude but copies them as real files for cursor", () => {
    const dest = tempDir();
    install(dest);
    expect(readFileSync(join(dest, ".agents/commands/review.md"), "utf8")).toContain("`review`");
    expect(readlinkSync(join(dest, ".claude/commands"))).toBe("../.agents/commands");
    expect(existsSync(join(dest, ".claude/commands/plan.md"))).toBe(true);
    expect(lstatSync(join(dest, ".cursor/commands")).isSymbolicLink()).toBe(false);
    expect(readFileSync(join(dest, ".cursor/commands/plan.md"), "utf8")).toContain("`plan`");
    expect(lstatSync(join(dest, ".cursor/agents")).isSymbolicLink()).toBe(false);
    expect(readFileSync(join(dest, ".cursor/agents/verifier.md"), "utf8")).toContain("verifier");
  });

  it("never overwrites the cursor copies: edits survive a second run", () => {
    const dest = tempDir();
    install(dest, { providers: ["cursor"] });
    writeFileSync(join(dest, ".cursor/commands/review.md"), "mine\n");
    const again = install(dest, { providers: ["cursor"] });
    expect(again.every((a) => a.kind === "skip")).toBe(true);
    expect(readFileSync(join(dest, ".cursor/commands/review.md"), "utf8")).toBe("mine\n");
  });

  it("adds no provider layer for codex and muse: they read the shared source", () => {
    const dest = tempDir();
    const actions = install(dest, { providers: ["codex", "muse"] });
    expect(existsSync(join(dest, "AGENTS.md"))).toBe(true);
    expect(existsSync(join(dest, ".agents/skills/ground-truth/SKILL.md"))).toBe(true);
    for (const dir of [".claude", ".cursor", ".codex", ".muse"]) {
      expect(existsSync(join(dest, dir)), dir).toBe(false);
    }
    expect(actions.some((a) => a.path !== "AGENTS.md" && !a.path.startsWith(".agents/"))).toBe(false);
  });

  it("installs no commands when the manifest lists none", () => {
    const kit = tempDir();
    put(kit, "kit.json", JSON.stringify({ presets: { core: ["alpha"] }, agents: [] }));
    put(kit, "skills/alpha/SKILL.md", "x");
    put(kit, "AGENTS.template.md", "t");
    put(kit, "THIRD_PARTY_NOTICES.md", "n");
    const dest = tempDir();
    install(dest, { kit });
    expect(existsSync(join(dest, ".agents/commands"))).toBe(false);
  });

  it("returns an error for an unknown preset and writes no skills", () => {
    const dest = tempDir();
    const result = installKit({ dest, preset: "nope" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('unknown preset "nope"');
    expect(existsSync(join(dest, ".agents/skills"))).toBe(false);
  });

  it("returns an error when the kit manifest lists a missing command or a bad commands value", () => {
    const missing = tempDir();
    put(missing, "kit.json", JSON.stringify({ presets: { core: ["alpha"] }, agents: [], commands: ["ghost"] }));
    put(missing, "skills/alpha/SKILL.md", "x");
    const result = installKit({ dest: tempDir(), kit: missing });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('kit has no command "ghost"');
    const bad = tempDir();
    put(bad, "kit.json", JSON.stringify({ presets: { core: [] }, agents: [], commands: "nope" }));
    const badResult = installKit({ dest: tempDir(), kit: bad });
    expect(badResult.ok).toBe(false);
    if (!badResult.ok) expect(badResult.error.message).toContain("must be a string list");
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

  it("rejects a preset value that is neither a list nor a star", () => {
    const kit = tempDir();
    put(kit, "kit.json", JSON.stringify({ presets: { core: 42 }, agents: [] }));
    const result = readManifest(kit);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('preset "core" must be a string list or "*"');
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
    writeFileSync(join(dest, "AGENTS.md"), "mine\n\nClimb the ladder.\n");
    install(dest);
    expect(readFileSync(join(dest, "CLAUDE.md"), "utf8")).toBe("mine\n\nClimb the ladder.\n");
  });

  it("dry run reports the same actions as the real run", () => {
    const planned = install(tempDir(), { dryRun: true });
    const done = install(tempDir());
    expect(planned).toEqual(done);
  });

  it("keeps a Role and style section at the top of the agent template, under the line budget", () => {
    const lines = readFileSync(join(kitRoot(), "AGENTS.template.md"), "utf8").split("\n");
    expect(lines.length).toBeLessThan(100);
    const role = lines.findIndex((l) => l === "## Role and style");
    const nonNegotiables = lines.findIndex((l) => l === "## Non-negotiables");
    expect(role).toBeGreaterThanOrEqual(0);
    expect(role).toBeLessThan(nonNegotiables);
    const section = lines.slice(role, nonNegotiables).join("\n").toLowerCase();
    for (const word of ["role", "tone", "language", "concise", "evidence", "consequences", "proven"]) {
      expect(section).toContain(word);
    }
  });

  it("setup-ai fills Role and style from evidence and asks one question when unknown", () => {
    const text = readFileSync(join(kitRoot(), "skills", "setup-ai", "SKILL.md"), "utf8");
    expect(text).toContain("Role and style");
    expect(text).toContain("exactly one question");
    for (const source of ["README", "commit"]) {
      expect(text).toContain(source);
    }
  });

  it("keeps one thin command file per manifest command, each running its skill", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const listed = manifest.value.commands ?? [];
    expect(listed.length).toBeGreaterThan(0);
    const onDisk = readdirSync(join(kitRoot(), "commands")).filter((f) => f.endsWith(".md"));
    expect(onDisk.sort()).toEqual(listed.map((name) => `${name}.md`).sort());
    for (const name of listed) {
      const text = readFileSync(join(kitRoot(), "commands", `${name}.md`), "utf8");
      const lines = text.trimEnd().split("\n").length;
      expect(lines, `${name} is ${lines} lines`).toBeGreaterThanOrEqual(3);
      expect(lines, `${name} is ${lines} lines`).toBeLessThanOrEqual(6);
      expect(text).toContain(`\`${name}\``);
      expect(text).toContain("$ARGUMENTS");
    }
  });

  it("setup-ai is provider-aware: shared source first, one ask when providers are unknown", () => {
    const text = readFileSync(join(kitRoot(), "skills", "setup-ai", "SKILL.md"), "utf8");
    expect(text.toLowerCase()).toContain("shared source");
    expect(text).toContain("which of cursor, claude, codex, muse");
    expect(text).toContain("setup-ai cursor");
  });

  it("setup-ai audits the ladder gap in existing setups and workspace roots", () => {
    const text = readFileSync(join(kitRoot(), "skills", "setup-ai", "SKILL.md"), "utf8");
    expect(text).toContain("Missing ladder");
    expect(text).toContain("add the missing ladder section");
    expect(text).toContain("the 7-question ladder (same section as the kit template)");
  });

  it("setup-ai covers multi-repo workspace roots and leaves children alone", () => {
    const text = readFileSync(join(kitRoot(), "skills", "setup-ai", "SKILL.md"), "utf8");
    expect(text).toContain("## Workspace mode");
    for (const phrase of [
      "one repo at a time",
      "nested `AGENTS.md` wins",
      "visibility rules",
      "how to sync",
      "Map cross-repo dependencies",
      "Never write inside a child repo\n  without asking",
    ]) {
      expect(text).toContain(phrase);
    }
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
