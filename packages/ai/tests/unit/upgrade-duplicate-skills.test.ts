import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main } from "#cli.js";
import { parseFrontmatter } from "#frontmatter.js";
import { installKit } from "#install.js";
import { checkDrift, validateKit } from "#validate.js";
import { failingIssues, put, tempDir } from "./helpers.js";

function run(...argv: string[]): { code: number; text: string; errors: string } {
  const out: string[] = [];
  const errors: string[] = [];
  const code = main(argv, { out: (line) => out.push(line), err: (line) => errors.push(line) });
  return { code, text: out.join("\n"), errors: errors.join("\n") };
}

/** Skill directories under root whose SKILL.md frontmatter claims `name`. */
function claimants(root: string, name: string): string[] {
  const skills = join(root, "skills");
  return readdirSync(skills, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((dir) => {
      const file = join(skills, dir, "SKILL.md");
      if (!existsSync(file)) return false;
      const front = parseFrontmatter(readFileSync(file, "utf8"));
      if (!front.ok) throw front.error;
      return front.value.data.name === name;
    })
    .sort();
}

/** An adopter on the old Cursor+Muse install (starter), with a personalized orchestrate skill. */
function seedLegacyCursorMuse(dest: string): void {
  const first = installKit({ dest, preset: "starter", providers: ["cursor", "muse"] });
  if (!first.ok) throw first.error;
  const skill = join(dest, ".agents", "skills", "orchestrate", "SKILL.md");
  writeFileSync(skill, `${readFileSync(skill, "utf8")}\nOur dispatch notes.\n`);
}

function setup(dest: string) {
  const result = installKit({ dest, preset: "setup", providers: ["cursor", "muse"], adopt: true });
  if (!result.ok) throw result.error;
  return result.value;
}

/** The pre-fix upgrade artifact: installer output with the sidecar name line reverted to the base name. */
function revertSidecarName(dest: string): void {
  const file = join(dest, ".agents", "skills", "zk-orchestrate", "SKILL.md");
  writeFileSync(file, readFileSync(file, "utf8").replace("name: zk-orchestrate", "name: orchestrate"));
}

describe("Upgrading Cursor+Muse with a personalized orchestrate skill", () => {
  it("adopt upgrade names the sidecar skill zk-orchestrate, leaving one orchestrate claimant", () => {
    const dest = tempDir();
    seedLegacyCursorMuse(dest);
    const userFile = join(dest, ".agents", "skills", "orchestrate", "SKILL.md");
    const before = readFileSync(userFile, "utf8");

    const upgrade = run("setup", dest, "--provider", "cursor,muse");
    expect(upgrade.code).toBe(0);
    expect(upgrade.errors).toBe("");

    expect(readFileSync(userFile, "utf8"), "user skill kept byte-identical").toBe(before);
    const sidecar = readFileSync(join(dest, ".agents", "skills", "zk-orchestrate", "SKILL.md"), "utf8");
    expect(sidecar).toContain("\nname: zk-orchestrate\n");
    expect(claimants(join(dest, ".agents"), "orchestrate")).toEqual(["orchestrate"]);
    expect(failingIssues(validateKit(join(dest, ".agents")))).toEqual([]);
  });

  it("a legacy verbatim sidecar fails validation as a duplicate skill name", () => {
    const dest = tempDir();
    seedLegacyCursorMuse(dest);
    setup(dest);
    revertSidecarName(dest);

    expect(claimants(join(dest, ".agents"), "orchestrate")).toEqual(["orchestrate", "zk-orchestrate"]);
    const found = validateKit(join(dest, ".agents")).map((issue) => `${issue.path}: ${issue.message}`);
    expect(found).toContainEqual(
      'skills/zk-orchestrate/SKILL.md: duplicate skill name "orchestrate" (also claimed by skills/orchestrate/SKILL.md); re-run setup to refresh the sidecar, or merge it into your copy and delete it',
    );
  });

  it("re-running setup migrates the legacy sidecar name, keeps user bytes, then no-ops", () => {
    const dest = tempDir();
    seedLegacyCursorMuse(dest);
    setup(dest);
    revertSidecarName(dest);
    const userFile = join(dest, ".agents", "skills", "orchestrate", "SKILL.md");
    const before = readFileSync(userFile, "utf8");
    const sidecarFile = join(dest, ".agents", "skills", "zk-orchestrate", "SKILL.md");
    writeFileSync(sidecarFile, `${readFileSync(sidecarFile, "utf8")}\nSidecar margin note.\n`);

    const migrate = setup(dest);
    expect(migrate.some((action) => action.kind === "write" && action.path.includes("zk-orchestrate"))).toBe(true);
    expect(readFileSync(sidecarFile, "utf8")).toContain("\nname: zk-orchestrate\n");
    expect(readFileSync(sidecarFile, "utf8")).toContain("Sidecar margin note.");
    expect(readFileSync(userFile, "utf8"), "user skill kept byte-identical").toBe(before);
    expect(claimants(join(dest, ".agents"), "orchestrate")).toEqual(["orchestrate"]);
    expect(failingIssues(validateKit(join(dest, ".agents")))).toEqual([]);

    const again = setup(dest);
    expect(again.filter((action) => action.kind !== "skip")).toEqual([]);
  });

  it("a dry run reports the migration without touching the sidecar", () => {
    const dest = tempDir();
    seedLegacyCursorMuse(dest);
    setup(dest);
    revertSidecarName(dest);
    const sidecarFile = join(dest, ".agents", "skills", "zk-orchestrate", "SKILL.md");
    const before = readFileSync(sidecarFile, "utf8");

    const result = installKit({ dest, preset: "setup", providers: ["cursor", "muse"], adopt: true, dryRun: true });
    if (!result.ok) throw result.error;
    expect(result.value.some((action) => action.kind === "write" && action.path.includes("zk-orchestrate"))).toBe(true);
    expect(readFileSync(sidecarFile, "utf8"), "dry run writes nothing").toBe(before);
  });

  it("leaves a sidecar with a folded name line alone", () => {
    const dest = tempDir();
    seedLegacyCursorMuse(dest);
    setup(dest);
    const sidecarFile = join(dest, ".agents", "skills", "zk-orchestrate", "SKILL.md");
    const folded = '---\nname: >\n  orchestrate\ndescription: "Folded."\n---\nbody\n';
    writeFileSync(sidecarFile, folded);

    const actions = setup(dest);
    expect(actions.filter((action) => action.kind === "write" && action.path.includes("zk-orchestrate"))).toEqual([]);
    expect(readFileSync(sidecarFile, "utf8")).toBe(folded);
  });

  it("leaves a sidecar with unreadable frontmatter alone", () => {
    const dest = tempDir();
    seedLegacyCursorMuse(dest);
    setup(dest);
    const sidecarFile = join(dest, ".agents", "skills", "zk-orchestrate", "SKILL.md");
    writeFileSync(sidecarFile, "---\nname: [broken\n---\nbody\n");

    const actions = setup(dest);
    expect(actions.filter((action) => action.kind === "write" && action.path.includes("zk-orchestrate"))).toEqual([]);
    expect(readFileSync(sidecarFile, "utf8")).toBe("---\nname: [broken\n---\nbody\n");
  });

  it("the orchestrate command keeps a unique skill target after migration", () => {
    const dest = tempDir();
    seedLegacyCursorMuse(dest);
    setup(dest);
    revertSidecarName(dest);
    setup(dest);

    expect(existsSync(join(dest, ".agents", "commands", "orchestrate.md"))).toBe(false);
    const issues = failingIssues(validateKit(join(dest, ".agents")));
    expect(issues.filter((issue) => issue.path.includes("orchestrate"))).toEqual([]);
    expect(claimants(join(dest, ".agents"), "orchestrate")).toEqual(["orchestrate"]);
  });
});

describe("provider layer with a same-named project skill (D5)", () => {
  function seedHouseReview(dest: string): void {
    // Replace the whole-dir link with a real project layer first: writing
    // through the link would rename the shared canonical source.
    const layer = join(dest, ".claude", "skills");
    if (lstatSync(layer).isSymbolicLink()) unlinkSync(layer);
    mkdirSync(join(layer, "review"), { recursive: true });
    put(dest, ".claude/skills/review/SKILL.md", '---\nname: review\n---\n\n# House review checklist\n');
  }

  function setupAdopt(dest: string) {
    const result = installKit({ dest, preset: "setup", providers: ["claude", "cursor"], adopt: true });
    if (!result.ok) throw result.error;
    return result.value;
  }

  it("copies the kit skill beside the house skill under zk-review without touching the canonical source", () => {
    const dest = tempDir();
    setupAdopt(dest);
    const canonical = readFileSync(join(dest, ".agents", "skills", "review", "SKILL.md"), "utf8");
    seedHouseReview(dest);

    setupAdopt(dest);

    // The house skill is kept byte-identical; the kit source still claims the
    // kit name (installed bytes are conditional-resolved, so compare identity,
    // not raw bytes).
    expect(readFileSync(join(dest, ".claude", "skills", "review", "SKILL.md"), "utf8")).toContain("# House review checklist");
    expect(readFileSync(join(dest, ".agents", "skills", "review", "SKILL.md"), "utf8")).toBe(canonical);
    const canonicalFront = parseFrontmatter(canonical);
    if (!canonicalFront.ok) throw canonicalFront.error;
    expect(canonicalFront.value.data.name).toBe("review");
    expect(canonical).not.toContain("House review checklist");
    // The layer sidecar is a real copy renamed to zk-review, never a link
    // through which a rename could reach the shared source.
    const sidecar = join(dest, ".claude", "skills", "zk-review", "SKILL.md");
    expect(lstatSync(join(dest, ".claude", "skills", "zk-review")).isSymbolicLink()).toBe(false);
    const sidecarFront = parseFrontmatter(readFileSync(sidecar, "utf8"));
    if (!sidecarFront.ok) throw sidecarFront.error;
    expect(sidecarFront.value.data.name).toBe("zk-review");
    expect(claimants(join(dest, ".claude"), "review")).toEqual(["review"]);
  });

  it("validate flags a same-named unrenamed link in a layer", () => {
    const dest = tempDir();
    setupAdopt(dest);
    seedHouseReview(dest);
    // Simulate the pre-fix layout: an unrenamed kit link beside the house skill.
    symlinkSync("../../.agents/skills/review", join(dest, ".claude", "skills", "zk-review"));
    const issues = checkDrift(dest, join(dest, ".agents"));
    expect(issues.map((issue) => `${issue.path}: ${issue.message}`)).toContainEqual(
      expect.stringContaining('duplicate skill name "review"'),
    );
  });

  it("a rerun with the house skill and the sidecar is a no-op (D4 for layers)", () => {
    const dest = tempDir();
    setupAdopt(dest);
    seedHouseReview(dest);
    setupAdopt(dest);

    const again = setupAdopt(dest);
    expect(again.filter((action) => action.kind !== "skip")).toEqual([]);
  });
});
