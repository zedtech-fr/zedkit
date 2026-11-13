import {
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseFrontmatter } from "#frontmatter.js";
import { ALL_PROVIDERS, installKit } from "#install.js";
import { commandsForPreset, kitDir, readManifest } from "#kit.js";
import { checkDrift, validateKit } from "#validate.js";
import { failingIssues, put, SKILL, tempDir } from "./helpers.js";

const read = (...parts: string[]): string =>
  readFileSync(join(kitDir(), ...parts), "utf8");
const skill = read("skills", "quick-wins", "SKILL.md");
// Prose wraps; assertions read it as one line.
const flat = skill.replace(/\s+/gu, " ");

function install(dest: string, preset: string, providers: readonly string[]) {
  const result = installKit({ dest, preset, providers, adopt: true });
  if (!result.ok) throw result.error;
  return result.value;
}

function setup(
  dest: string,
  providers: readonly string[] = ["cursor", "claude"],
) {
  return install(dest, "setup", providers);
}

/** Skill directories whose SKILL.md frontmatter claims `name`. */
function claimants(root: string, name: string): string[] {
  const skills = join(root, "skills");
  return readdirSync(skills, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((dir) => {
      const file = join(skills, dir, "SKILL.md");
      if (!existsSync(file)) return false;
      const front = parseFrontmatter(readFileSync(file, "utf8"));
      return front.ok && front.value.data.name === name;
    })
    .sort();
}

/** Frontmatter names of every skill a provider layer exposes, links followed. */
function exposedSkillNames(layer: string): string[] {
  return readdirSync(layer)
    .filter((entry) => existsSync(join(layer, entry, "SKILL.md")))
    .map((entry) => {
      const front = parseFrontmatter(
        readFileSync(join(layer, entry, "SKILL.md"), "utf8"),
      );
      if (!front.ok) throw front.error;
      return String(front.value.data.name);
    });
}

describe("quick-wins skill contract", () => {
  it("is explicit-only, enters through orchestrate, and defaults to audit", () => {
    const front = parseFrontmatter(skill);
    if (!front.ok) throw front.error;
    expect(front.value.data.name).toBe("quick-wins");
    expect(front.value.data["disable-model-invocation"]).toBe(true);
    expect(String(front.value.data.description)).toContain("Use when");
    expect(flat).toContain("`Playbook: quick-wins`");
    expect(flat).toContain("hand the user's text to `orchestrate`");
    expect(flat).toContain("One defect with a known check is `/fix`");
    expect(flat).toContain("`/quick-wins audit <topic or scope>`");
    expect(flat).toContain("`/quick-wins implement <finding ids");
    expect(flat).toContain("No mode word means audit");
    expect(flat).toContain("when unsure, audit");
    expect(flat).toContain("no approval round per ordinary, reversible fix");
  });

  it("defines a quick win by four tests, sized by the whole effort", () => {
    for (const part of [
      "**beneficiary**",
      "**observable improvement**",
      "**contained change**",
      "**practical acceptance check**",
      "Size the whole effort, not the diff",
    ]) {
      expect(flat, part).toContain(part);
    }
  });

  it("gives every finding the required parts, a rank-independent id, and keeps hypotheses apart", () => {
    const block = /### Findings \(ranked\)\n([\s\S]*?)### Hypotheses/.exec(
      skill,
    );
    const template = block?.[1] ?? "";
    expect(template).toContain("**QW-<topic>-<subject>**");
    for (const label of [
      "Problem:",
      "For whom:",
      "Evidence:",
      "Change:",
      "Depends on:",
      "Effort / risk:",
      "Accept when:",
      "Why this rank:",
    ]) {
      expect(template, label).toContain(`- ${label}`);
    }
    expect(flat).toContain("never the rank");
    expect(flat).toContain("A hypothesis is never a finding");
    expect(flat).toContain("### Hypotheses (not findings)");
    expect(flat).toContain("`No worthwhile quick wins found in this scope`");
  });

  it("proves an audit read-only, saves only on request, and files tickets through from-audit", () => {
    expect(flat).toContain(
      "`git status --porcelain` plus `git diff HEAD | sha256sum`",
    );
    expect(flat).toContain("throwaway copy or temp directory");
    expect(flat).toContain("Nothing is saved unless asked");
    expect(flat).toContain("hand the report to `from-audit`");
    expect(flat).toContain("The workflow needs no tracker");
    expect(flat).toContain(
      "An audit built nothing, so it closes without a `verifier` spawn",
    );
  });

  it("revalidates before editing, routes expanded findings to plan, and protects work in progress", () => {
    expect(flat).toContain("Revalidate each finding at HEAD before any edit");
    for (const outcome of [
      "`valid`",
      "`resolved`",
      "`changed`",
      "`expanded`",
    ]) {
      expect(flat, outcome).toContain(outcome);
    }
    expect(flat).toContain("carry it into `plan` (`Playbook: plan`)");
    expect(flat).toContain("Continue with independent candidates");
    expect(flat).toContain("what is dirty now is not yours");
    expect(flat).toContain("never a path that was dirty at the start");
    expect(flat).toContain("Stage and commit by explicit paths");
  });

  it("builds through implement and its own review, without a second one", () => {
    expect(flat).toContain("`implement` (`Playbook: implement`)");
    expect(flat).toContain("`challenge` once for the batch");
    expect(flat).toContain("that is the one review, so run no second one");
    // The vendored implement skill keeps ending on review: no contradiction.
    expect(read("skills", "implement", "SKILL.md")).toContain(
      'call the Skill tool with "review"',
    );
    expect(flat).toContain(
      "| Finding | Reassessed | Implemented | Verified | Unresolved |",
    );
    expect(flat).toContain("**Pending**");
  });

  it("uses specialists only against a named question and adds no limits, models or teams", () => {
    for (const part of [
      "**Question**",
      "**Expertise**",
      "**Decision it changes**",
      "No line, no spawn.",
      "Well-understood work stays inline.",
      "This skill adds no limits, model choices or required team",
      "`observed` (the provider showed it), `estimate` or `unavailable`",
      "ran on another model",
    ]) {
      expect(flat, part).toContain(part);
    }
  });

  it("stays portable and valid: no model ids, kit validates", () => {
    expect(skill).not.toMatch(
      /\b(claude|gpt|gemini|grok|composer)-[a-z0-9.]+/iu,
    );
    expect(failingIssues(validateKit(kitDir()))).toEqual([]);
  });
});

describe("quick-wins shipping", () => {
  it("ships the skill on setup, core and full, not a command, and not in starter", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const { presets } = manifest.value;
    for (const preset of ["setup", "core"]) {
      expect(presets[preset], preset).toContain("quick-wins");
      expect(commandsForPreset(manifest.value, preset), preset).not.toContain(
        "quick-wins",
      );
    }
    expect(presets.full).toBe("*");
    expect(presets.starter).not.toContain("quick-wins");
    expect(commandsForPreset(manifest.value, "starter")).not.toContain(
      "quick-wins",
    );
    expect(read("commands", "quick-wins.md")).toContain(
      "Run the `quick-wins` skill on `$ARGUMENTS`",
    );
    expect(
      manifest.value.agents.filter((name) => name.includes("quick")),
    ).toEqual([]);
  });

  it("starter stays lean: no skill, no command, no orchestrator row", () => {
    const dest = tempDir();
    install(dest, "starter", ["cursor", "claude"]);
    expect(existsSync(join(dest, ".agents/skills/quick-wins"))).toBe(false);
    expect(existsSync(join(dest, ".agents/commands/quick-wins.md"))).toBe(
      false,
    );
    expect(existsSync(join(dest, ".cursor/commands/quick-wins.md"))).toBe(
      false,
    );
    expect(
      readFileSync(join(dest, ".agents/agents/orchestrator.md"), "utf8"),
    ).not.toContain("quick-wins");
    expect(failingIssues(validateKit(join(dest, ".agents")))).toEqual([]);
  });

  it("a fresh install discovers the skill once per provider layer and does not write the command", () => {
    const dest = tempDir();
    setup(dest, ALL_PROVIDERS);
    expect(failingIssues(validateKit(join(dest, ".agents")))).toEqual([]);
    expect(checkDrift(dest, join(dest, ".agents"))).toEqual([]);
    expect(claimants(join(dest, ".agents"), "quick-wins")).toEqual([
      "quick-wins",
    ]);
    expect(existsSync(join(dest, ".agents/commands/quick-wins.md"))).toBe(false);
    for (const layer of [".cursor", ".claude"]) {
      const names = exposedSkillNames(join(dest, layer, "skills"));
      expect(
        names.filter((name) => name === "quick-wins"),
        layer,
      ).toHaveLength(1);
      expect(new Set(names).size, `${layer} skill names are unique`).toBe(
        names.length,
      );
      const commands = readdirSync(join(dest, layer, "commands")).filter(
        (file) => file.startsWith("quick-wins"),
      );
      expect(commands, `${layer} commands`).toEqual([]);
    }
  });

  it("repeating setup changes nothing and adds no sidecar", () => {
    const dest = tempDir();
    setup(dest);
    const again = setup(dest);
    expect(again.filter((action) => action.kind !== "skip")).toEqual([]);
    const sidecars = readdirSync(join(dest, ".agents"), { recursive: true })
      .map(String)
      .filter((path) => /(^|\/)zk-|\.kit\.md$/u.test(path));
    expect(sidecars).toEqual([]);
  });

  it("upgrades an install from before quick-wins: adds it, keeps the older orchestrator, stays valid", () => {
    const dest = tempDir();
    setup(dest);
    const orchestrator = join(dest, ".agents/agents/orchestrator.md");
    const older = readFileSync(orchestrator, "utf8")
      .replace(/^\| One defect \|.*\n/mu, "")
      .replace(/^\| Review punchlist \|.*\n/mu, "")
      .replace(/^\| Quick wins \|.*\n/mu, "");
    // An older copy: the new playbook rows are absent, so it is not this kit.
    expect(older).not.toBe(readFileSync(orchestrator, "utf8"));
    writeFileSync(orchestrator, older);
    rmSync(join(dest, ".agents/skills/quick-wins"), { recursive: true });

    const changed = setup(dest)
      .filter((action) => action.kind !== "skip")
      .map((action) => action.path);
    expect(changed).toEqual(
      expect.arrayContaining([".agents/skills/quick-wins"]),
    );
    expect(changed.some((path) => path.includes("commands/quick-wins"))).toBe(
      false,
    );
    expect(readFileSync(orchestrator, "utf8")).toBe(older);
    expect(
      readFileSync(join(dest, ".agents/agents/orchestrator.kit.md"), "utf8"),
    ).toContain("`quick-wins`");
    // An older orchestrator has no row, so the hand-off names the skill file.
    expect(flat).toContain("Name this `SKILL.md` in the brief");
    expect(failingIssues(validateKit(join(dest, ".agents")))).toEqual([]);
    expect(claimants(join(dest, ".agents"), "quick-wins")).toEqual([
      "quick-wins",
    ]);
  });

  it("keeps a team's own leftover /quick-wins command and does not write a kit sidecar", () => {
    const dest = tempDir();
    const mine = "# our quick-wins\n";
    for (const layer of [".cursor", ".claude"]) {
      put(dest, `${layer}/skills/team/SKILL.md`, SKILL("team"));
      put(dest, `${layer}/commands/quick-wins.md`, mine);
    }
    setup(dest);
    for (const layer of [".cursor", ".claude"]) {
      expect(
        readFileSync(join(dest, layer, "commands/quick-wins.md"), "utf8"),
        layer,
      ).toBe(mine);
      expect(existsSync(join(dest, layer, "commands/quick-wins.kit.md")), layer).toBe(
        false,
      );
      const names = exposedSkillNames(join(dest, layer, "skills"));
      expect(names).toContain("team");
      expect(names.filter((name) => name === "quick-wins")).toHaveLength(1);
      expect(new Set(names).size, `${layer} skill names are unique`).toBe(
        names.length,
      );
    }
    expect(failingIssues(validateKit(join(dest, ".agents")))).toEqual([]);
  });

  it("keeps a team's own quick-wins skill and gives the kit's a distinct name", () => {
    const dest = tempDir();
    const own = SKILL("quick-wins");
    put(dest, ".agents/skills/quick-wins/SKILL.md", own);
    setup(dest);
    expect(
      readFileSync(join(dest, ".agents/skills/quick-wins/SKILL.md"), "utf8"),
    ).toBe(own);
    expect(claimants(join(dest, ".agents"), "quick-wins")).toEqual([
      "quick-wins",
    ]);
    expect(claimants(join(dest, ".agents"), "zk-quick-wins")).toEqual([
      "zk-quick-wins",
    ]);
    expect(failingIssues(validateKit(join(dest, ".agents")))).toEqual([]);
  });

  // Known, pre-existing for every skill name a team already owns: with the
  // team's skill only under `.agents/skills` and real provider skill dirs, the
  // installer links both `<name>` and `zk-<name>` to the kit sidecar, so the
  // provider lists the sidecar twice and not the team's skill.
  it.todo(
    "a team-owned quick-wins skill is listed once per provider skill dir",
  );
});
