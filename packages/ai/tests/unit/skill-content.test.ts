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

  it("every message picks depth before answering, and a search loads audit", () => {
    const template = readFileSync(join(kitDir(), "AGENTS.template.md"), "utf8");
    expect(template).toContain("Depth first");
    expect(template).toMatch(/are there other\/unused/u);
    const audit = readFileSync(
      join(kitDir(), "skills", "audit", "SKILL.md"),
      "utf8",
    );
    expect(audit).toMatch(/^description:.*search or inventory/mu);
    const orchestrate = readFileSync(
      join(kitDir(), "skills", "orchestrate", "SKILL.md"),
      "utf8",
    );
    expect(orchestrate).toMatch(/^description:.*when the request is deep/mu);
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
    expect(review).toContain("adjust its severity either way");
    expect(review).toContain("absence does not drop blockers");
    expect(review).not.toContain("may only drop or demote");
  });

  it("definition of done warns on file-count growth and separates a scope change", () => {
    const dod = readFileSync(
      join(kitDir(), "skills", "definition-of-done", "SKILL.md"),
      "utf8",
    );
    expect(dod).toContain("File-count growth past the first estimate");
    expect(dod).toContain("Do not stop.");
    expect(dod).toContain("authorized scope");
    expect(dod).toContain("may need a decision");
    expect(dod).not.toContain("stop and propose a split");
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
    expect(from).toContain("Do not implement by default");
    expect(from).toContain("honor that authorization");
    expect(from).toContain("Revalidate against the current state");
    expect(from).toContain("Research spike");
    expect(from).toContain("Owner decision");
    expect(from).toContain("quiz-for-approval and publish steps are not automatic");
    expect(from).toContain("carry that approval through");
    expect(from).toContain("only when the user asked for tickets");
    expect(from).toContain("resolve the contradiction");
    expect(from).toContain("obsolete execution rule");
    expect(from).not.toContain("that file is task 1");
    expect(to).toContain("Playbook: to-audit");
    expect(to).toContain("before `plan`");
    expect(to).toContain("Do not implement");
    expect(from).toContain("hand the user's text to `orchestrate`");
    expect(to).toContain("hand the user's text to `orchestrate`");
  });

  it("audit investigates against a coverage map and only fixes when asked", () => {
    const raw = readFileSync(
      join(kitDir(), "skills", "audit", "SKILL.md"),
      "utf8",
    );
    expect(raw).toContain("coverage map");
    expect(raw).toContain("Investigate (default)");
    expect(raw).toContain("fixes only when the same request asks for them");
    expect(raw).toContain("Verified defect");
    expect(raw).toContain("Requirement gap");
    expect(raw).toContain("acceptance criterion");
    expect(raw).toContain("Unresolved after investigation");
    expect(raw).toContain("Listing it does not close it");
    expect(raw).toContain("complete only when no row is **not checked**");
    expect(raw).not.toContain("answered with evidence or explicitly listed as unresolved");
    expect(raw).toContain("source → shipped/installed artifact");
    expect(raw).toContain("never the whole investigation");
    expect(raw).toContain("Not checked:");
    expect(raw).toContain("retained artifact");
    expect(raw).not.toContain(
      "or a result whose data is null, stays **Not checked** until this session repeats",
    );
    expect(raw).not.toContain("opens small issues and fix PRs");
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

  it("durable deliverables persist by default, amend in place, and warn that .scratch is not portable", () => {
    const handoff = readFileSync(
      join(kitDir(), "skills", "handoff", "SKILL.md"),
      "utf8",
    );
    expect(handoff).toContain("## Durable deliverables (persist by default)");
    expect(handoff).toContain("chat is the summary, files are the record");
    expect(handoff).toContain("explicit `chat-only` or `no-write` request stays in chat");
    expect(handoff).toContain("amend the artifact instead of forking");
    expect(handoff).toContain("does not travel across clones");
    expect(handoff).toContain("names every required artifact");
    for (const skill of ["audit", "plan", "from-audit"]) {
      const text = readFileSync(
        join(kitDir(), "skills", skill, "SKILL.md"),
        "utf8",
      );
      expect(text, skill).toContain("per handoff's Durable deliverables section");
    }
    const implement = readFileSync(
      join(kitDir(), "skills", "implement", "SKILL.md"),
      "utf8",
    );
    expect(implement).toContain("Read the saved plan first and keep its checklist current");
    const fromAudit = readFileSync(
      join(kitDir(), "skills", "from-audit", "SKILL.md"),
      "utf8",
    );
    expect(fromAudit).toContain("Prefer the saved audit file");
    expect(fromAudit).toContain(".scratch/<slug>/spec.md");
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
