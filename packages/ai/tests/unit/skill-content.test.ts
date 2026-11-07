import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";

// A "Skill tool" instruction only runs where that tool exists. Every one
// carries the shared fallback within a few lines: open the skill file and
// follow it here. Explicit-only skills still need an explicit user call.
const TRIGGER = /the Skill tool (with|for)/u;
const FALLBACK = "Without a Skill tool";

function skillFiles(): Array<[string, string[]]> {
  const dir = join(kitDir(), "skills");
  return readdirSync(dir)
    .filter((name) => !name.startsWith("LICENSE-"))
    .map((name) => {
      const file = join(dir, name, "SKILL.md");
      return [
        `skills/${name}/SKILL.md`,
        readFileSync(file, "utf8").split("\n"),
      ] as [string, string[]];
    });
}

describe("skill content conventions", () => {
  it("every Skill-tool call carries the shared SKILL.md fallback within five lines", () => {
    let triggers = 0;
    for (const [path, lines] of skillFiles()) {
      lines.forEach((line, index) => {
        if (!TRIGGER.test(line)) return;
        triggers += 1;
        const window = lines.slice(index, index + 6).join("\n");
        expect(window, `${path}:${index + 1} lacks the fallback`).toContain(
          FALLBACK,
        );
        expect(window, `${path}:${index + 1} fallback names no tool`).toContain(
          "SKILL.md",
        );
        expect(
          window,
          `${path}:${index + 1} fallback keeps explicit-only explicit`,
        ).toMatch(/explicit/iu);
      });
    }
    expect(triggers).toBeGreaterThan(0);
  });

  it("the orchestrate fallback returns briefs first and marks inline work", () => {
    const raw = readFileSync(
      join(kitDir(), "skills", "orchestrate", "SKILL.md"),
      "utf8",
    );
    expect(raw).toContain("return ready-to-run briefs (`dispatch plan`)");
    expect(raw).toContain("`Mode: inline fallback (<observed cause>)`");
    expect(raw).not.toContain("eight steps");
  });

  it("the orchestrator records dispatch failures and closing usage", () => {
    const raw = readFileSync(
      join(kitDir(), "agents", "orchestrator.md"),
      "utf8",
    );
    expect(raw).toContain("On a dispatch failure, record the attempted");
    expect(raw).toContain("## Dispatch failures");
    expect(raw).toContain("actual spawns, retries, and elapsed time");
    expect(raw).toContain(".agents/tokenomics.md");
    expect(raw).toContain("What do I need for this request?");
    expect(raw.replace(/\s+/g, " ")).toContain(
      "Go deep, be strict, and be brutally honest",
    );
    expect(raw).toContain("`Playbook: <name>`");
    expect(raw).toContain("explicitly requested fast mode");
  });

  it("the orchestrate skill asks for tokenomics and a build team", () => {
    const raw = readFileSync(
      join(kitDir(), "skills", "orchestrate", "SKILL.md"),
      "utf8",
    );
    expect(raw).toContain(".agents/tokenomics.md");
    expect(raw.replace(/\s+/g, " ")).toContain(
      "Build team: what do I need for this request?",
    );
  });

  it("plan, challenge and review go through orchestrate and set the quality bar", () => {
    for (const name of ["plan", "challenge", "review"] as const) {
      const raw = readFileSync(
        join(kitDir(), "skills", name, "SKILL.md"),
        "utf8",
      );
      expect(raw, name).toContain(`Playbook: ${name}`);
      expect(raw, name).toContain("hand the user's text to `orchestrate`");
      expect(raw, name).toContain("Go deep, be strict, and be brutally honest");
    }
    const review = readFileSync(
      join(kitDir(), "skills", "review", "SKILL.md"),
      "utf8",
    );
    expect(review).toContain("second independent `check` spawn");
    expect(review).toContain("drop or demote");
  });

  it("implement, audit and research also go through orchestrate", () => {
    for (const name of ["implement", "audit", "research"] as const) {
      const raw = readFileSync(
        join(kitDir(), "skills", name, "SKILL.md"),
        "utf8",
      );
      expect(raw, name).toContain(`Playbook: ${name}`);
      expect(raw, name).toContain("hand the user's text to `orchestrate`");
    }
  });

  it("from-audit and to-audit are opposite entrypoints that also go through orchestrate", () => {
    const from = readFileSync(
      join(kitDir(), "skills", "from-audit", "SKILL.md"),
      "utf8",
    );
    const to = readFileSync(
      join(kitDir(), "skills", "to-audit", "SKILL.md"),
      "utf8",
    );
    expect(from).toContain("Playbook: from-audit");
    expect(from).toContain("to-tickets");
    expect(from).toContain("Do not implement");
    expect(to).toContain("Playbook: to-audit");
    expect(to).toContain("before `plan`");
    expect(to).toContain("Do not implement");
    expect(from).toContain("hand the user's text to `orchestrate`");
    expect(to).toContain("hand the user's text to `orchestrate`");
  });

  it("implement ends on unit plus integration, never the e2e battery by default", () => {
    const raw = readFileSync(
      join(kitDir(), "skills", "implement", "SKILL.md"),
      "utf8",
    );
    expect(raw).toContain("the unit plus integration suites once at the end");
    expect(raw).toContain(
      "never the end-to-end battery unless a critical path justifies it",
    );
    expect(raw).not.toContain("full test suite");
  });

  it("plans require an assumptions table and challenge blocks when it is missing", () => {
    const plan = readFileSync(
      join(kitDir(), "skills", "plan", "SKILL.md"),
      "utf8",
    );
    expect(plan).toContain("### Assumptions");
    expect(plan).toMatch(/blocking/iu);
    const challenge = readFileSync(
      join(kitDir(), "skills", "challenge", "SKILL.md"),
      "utf8",
    );
    expect(challenge).toMatch(/\*\*BLOCKING\*\*/u);
    expect(challenge).toContain("### Assumptions");
    const template = readFileSync(join(kitDir(), "AGENTS.template.md"), "utf8");
    expect(template).toMatch(/List assumptions before code or a plan/u);
    expect(template).toMatch(/green ≤20/u);
    expect(template).toContain("Rules: none");
    const upkeep = readFileSync(
      join(kitDir(), "skills", "rules-upkeep", "SKILL.md"),
      "utf8",
    );
    expect(upkeep).toMatch(/One reusable correction changed the work/u);
    expect(upkeep).toContain("## Mandatory output");
    expect(upkeep).toContain("prefixed `**/`");
  });

  it("unconfigured plans default to git-ignored .scratch, never docs", () => {
    const plan = readFileSync(
      join(kitDir(), "skills", "plan", "SKILL.md"),
      "utf8",
    );
    expect(plan).toContain(".scratch/<feature-slug>/spec.md");
    expect(plan).toContain("never `docs/`");
    const spec = readFileSync(
      join(kitDir(), "skills", "to-spec", "SKILL.md"),
      "utf8",
    );
    expect(spec).toContain(
      "With nobody to ask, use local files under `.scratch/<feature-slug>/`",
    );
    const tickets = readFileSync(
      join(kitDir(), "skills", "to-tickets", "SKILL.md"),
      "utf8",
    );
    expect(tickets).toContain(
      "With none configured and nobody to ask, use local files:",
    );
  });

  it("the verifier records revision and output, one gate, pending stays pending", () => {
    const raw = readFileSync(join(kitDir(), "agents", "verifier.md"), "utf8");
    expect(raw).toContain("Record the revision each gate ran on");
    expect(raw).toContain("failures with their output, never summarized away");
    expect(raw).toContain(
      "Both review passes are one gate, not two independent reviews",
    );
    expect(raw).toContain("stays pending — never READY");
    expect(raw).toContain(
      "Gates: <command — revision — exit code — output excerpt>",
    );
  });
});
