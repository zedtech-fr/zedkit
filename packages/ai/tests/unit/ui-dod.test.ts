import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";
import { lensTableRows } from "./helpers.js";

function kitRaw(path: string): string {
  return readFileSync(join(kitDir(), path), "utf8");
}

function kitText(path: string): string {
  return kitRaw(path).replace(/\s+/g, " ").toLowerCase();
}

const OPTIONAL_AXE = "only when a spec you changed already has them";
const HERO_THRESHOLD = "35%";
const UI_DOD_FILES = [
  "skills/definition-of-done/SKILL.md",
  "agents/verifier.md",
  "agents/ui-designer.md",
  "agents/a11y-auditor.md",
  "skills/review/lenses.md",
] as const;

describe("UI DoD v2", () => {
  it("pins the evidence matrix and looks-grid condition in Visual work", () => {
    const dod = kitText("skills/definition-of-done/SKILL.md");
    expect(dod).toContain("375");
    expect(dod).toContain("809");
    expect(dod).toContain("1440");
    expect(dod).toContain("light");
    expect(dod).toContain("dark");
    expect(dod).toContain("visual risk");
    expect(dod).toContain("token");
    expect(dod).toContain("primitive");
    expect(dod).toContain("identity");
    expect(dod).toContain("states:");
    expect(dod).toContain("necessary, not sufficient");
    expect(dod).not.toContain("6 looks");
    expect(dod).not.toContain("6 identities");
  });

  it("pins blocking measures and forbids optional-axe plus a hero-height threshold", () => {
    const dod = kitText("skills/definition-of-done/SKILL.md");
    expect(dod).toContain("wcag2a");
    expect(dod).toContain("wcag2aa");
    expect(dod).toContain("wcag21aa");
    expect(dod).toContain("wcag22aa");
    expect(dod).toContain("serious");
    expect(dod).toContain("critical");
    expect(dod).toContain("4.5");
    expect(dod).toContain("overflow");
    expect(dod).toContain("clipped");
    expect(dod).toContain("ellipsis");
    expect(dod).toContain("console");
    expect(dod).toContain("h1");
    expect(dod).toContain("24px");
    expect(kitRaw("skills/definition-of-done/SKILL.md")).not.toContain(OPTIONAL_AXE);
    expect(kitRaw("agents/verifier.md")).not.toContain(OPTIONAL_AXE);
    for (const path of UI_DOD_FILES) {
      expect(kitRaw(path), path).not.toContain(HERO_THRESHOLD);
    }
  });

  it("registers an evidence lens on UI surfaces, run by review", () => {
    const rows = lensTableRows().map((cells) => ({
      lens: cells[1] ?? "",
      runner: cells[2] ?? "",
      status: cells[3] ?? "",
      trigger: cells[4] ?? "",
      mandatory: cells[5] ?? "",
      output: cells[6] ?? "",
    }));
    const evidence = rows.find((row) => row.lens === "evidence");
    expect(evidence).toBeDefined();
    expect(evidence?.status).toBe("exists");
    expect(evidence?.mandatory).toBe("when triggered");
    expect(evidence?.runner).toContain("skill `review`");
    expect(evidence?.trigger).toContain("**/*.tsx");
    expect(evidence?.output.toLowerCase()).toContain("unseen");
    expect(kitRaw("skills/review/SKILL.md")).toMatch(
      /UI trigger[\s\S]*`evidence`[\s\S]*do not spawn `review`/u,
    );
    const copy = rows.find((row) => row.lens === "copy");
    expect(copy?.trigger.toLowerCase()).toMatch(/ui surface|\*\*\/\*\.tsx/u);
  });

  it("caps Confidence at 6 on UNSEEN and forbids ship without evidence", () => {
    const decision = kitRaw("skills/review/decision.md");
    expect(decision).toContain("Confidence");
    expect(decision).toContain("UNSEEN");
    expect(decision).toMatch(/\b6\b/u);
    expect(decision.toLowerCase()).toContain("ship");
    expect(decision).toContain("COMMENT");
    expect(kitText("agents/reviewer.md")).toContain("unseen");
    expect(kitText("agents/ui-designer.md")).toContain("unseen");
    expect(kitText("agents/ui-designer.md")).toContain("data-state=active");
    expect(kitText("agents/ui-designer.md")).toContain("inverted");
    expect(kitText("agents/a11y-auditor.md")).toContain("wcag2a");
    expect(kitText("agents/a11y-auditor.md")).toContain("clipped");
  });

  it("keeps kit-first and States: on UI tickets", () => {
    const lenses = kitText("skills/review/lenses.md");
    expect(lenses).toContain("docs-side css override");
    expect(lenses).toContain("documented one-off");
    expect(kitRaw("skills/to-tickets/SKILL.md")).toContain("States:");
    expect(kitRaw("skills/implement/SKILL.md")).toContain("States:");
    expect(kitText("AGENTS.template.md")).toContain("visual work");
    expect(kitRaw("AGENTS.template.md")).not.toContain("pnpm --filter docs");
  });
});
