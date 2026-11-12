import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";
import { lensTableRows } from "./helpers.js";

const UI_DOD_FILES = [
  "skills/definition-of-done/SKILL.md",
  "agents/verifier.md",
  "agents/ui-designer.md",
  "agents/a11y-auditor.md",
  "skills/review/lenses.md",
] as const;

function kitRaw(path: string): string {
  if (path.split("/").includes("..")) {
    throw new Error(`kitRaw: refused relative path ${path}`);
  }
  return readFileSync(join(kitDir(), path), "utf8");
}

function kitText(path: string): string {
  return kitRaw(path).replace(/\s+/g, " ").toLowerCase();
}

const OPTIONAL_AXE = "only when a spec you changed already has them";

describe("UI DoD v2", () => {
  it("refuses kitRaw paths that walk out of the kit", () => {
    expect(() => kitRaw("../package.json")).toThrow(/refused relative path/u);
  });

  it("pins the evidence matrix and looks-grid condition in Visual work", () => {
    const dod = kitText("skills/definition-of-done/SKILL.md");
    expect(dod).toContain("375 (phone)");
    expect(dod).toContain("809 (tablet / split-view)");
    expect(dod).toContain("1440 (desktop) × light and dark");
    expect(dod).toContain("visual risk");
    expect(dod).toContain("touched routes");
    expect(dod).toContain("host baseline");
    expect(dod).toContain("contact sheet");
    expect(dod).toContain("no transient states");
    expect(dod).toContain("necessary, not sufficient");
    expect(dod).not.toContain("6 looks");
    expect(dod).not.toContain("6 identities");
  });

  it("pins blocking measures and forbids restoring the old optional-axe sentence", () => {
    const dod = kitText("skills/definition-of-done/SKILL.md");
    expect(dod).toContain("wcag2a");
    expect(dod).toContain("wcag2aa");
    expect(dod).toContain("wcag21aa");
    expect(dod).toContain("wcag22aa");
    expect(dod).toContain("serious or critical");
    expect(dod).toContain("4.5");
    expect(dod).toContain("no horizontal overflow");
    expect(dod).toContain("no clipped text");
    expect(dod).toContain("unintended ellipsis");
    expect(dod).toContain("zero console errors");
    expect(dod).toContain("a single `h1`");
    expect(dod).toContain("24px");
    for (const path of UI_DOD_FILES) {
      expect(kitRaw(path), path).not.toContain(OPTIONAL_AXE);
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
    expect(evidence?.output.toLowerCase()).toContain("missing evidence");
    expect(evidence?.output.toLowerCase()).not.toContain("manifest");
    expect(kitRaw("skills/review/SKILL.md")).toMatch(
      /UI trigger[\s\S]*`evidence`[\s\S]*do not spawn `review`/u,
    );
    const copy = rows.find((row) => row.lens === "copy");
    expect(copy?.trigger.toLowerCase()).toContain("user-visible strings");
    expect(copy?.trigger).not.toContain("**/*.tsx");
  });

  it("caps Confidence at 6 on UNSEEN and forbids ship without evidence", () => {
    const decision = kitRaw("skills/review/decision.md");
    expect(decision).toContain("Confidence");
    expect(decision).toContain("UNSEEN");
    expect(decision).toContain("caps Confidence at 6");
    expect(decision).toContain("does not by itself forbid");
    expect(decision).toContain("Missing evidence");
    expect(decision).not.toContain("evidence manifest");
    expect(decision.toLowerCase()).toContain("ship");
    expect(decision).toContain("COMMENT");
    expect(decision).toContain("GitLab");
    expect(kitText("agents/reviewer.md")).toContain("partial-unseen");
    expect(kitText("agents/reviewer.md")).toContain("review/decision.md");
    expect(kitText("agents/ui-designer.md")).toContain("unseen");
    expect(kitText("agents/ui-designer.md")).toContain("inverted wells");
    expect(kitText("agents/ui-designer.md")).not.toContain("data-state=active");
    expect(kitText("agents/a11y-auditor.md")).toContain("wcag2a");
    expect(kitText("agents/a11y-auditor.md")).toContain("clipped text");
    expect(kitText("agents/verifier.md")).toContain(
      "apply definition-of-done visual work",
    );
  });

  it("keeps kit-first and States: on UI tickets", () => {
    const lenses = kitText("skills/review/lenses.md");
    expect(lenses).toContain("docs-side css override");
    expect(lenses).toContain(
      "documented local one-off the kit cannot yet express",
    );
    expect(kitRaw("skills/to-tickets/SKILL.md")).toContain("States:");
    expect(kitRaw("skills/to-tickets/SKILL.md")).toContain("no transient states");
    expect(kitRaw("skills/to-tickets/SKILL.md")).toContain(
      "clipboard-success confirmation",
    );
    expect(kitRaw("skills/implement/SKILL.md")).toContain("States:");
    expect(kitText("AGENTS.template.md")).toContain("visual work");
  });
});
