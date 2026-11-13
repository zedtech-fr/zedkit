import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { deprecatedCommandNames, kitDir, readManifest } from "#kit.js";

function kit(rel: string): string {
  return readFileSync(join(kitDir(), rel), "utf8").replace(/\s+/g, " ");
}

describe("execution portability", () => {
  it("routes the model via the spawn tool, never pasted into brief text", () => {
    for (const rel of [
      "agents/orchestrator.md",
      "skills/orchestrate/SKILL.md",
      "skills/review/SKILL.md",
      "skills/parallel-work/SKILL.md",
    ]) {
      const text = kit(rel);
      expect(text, rel).toContain("spawn tool's model parameter");
      expect(text, rel).toContain("pasting");
    }
  });

  it("treats a tool without a model parameter as not routable", () => {
    for (const rel of [
      "agents/orchestrator.md",
      "skills/orchestrate/SKILL.md",
      "skills/review/SKILL.md",
    ]) {
      expect(kit(rel), rel).toContain("no model parameter");
    }
  });

  it("pins the CLI to the local commit and refuses unpinned npx", () => {
    for (const rel of [
      "agents/orchestrator.md",
      "skills/orchestrate/SKILL.md",
      "skills/review/SKILL.md",
    ]) {
      const text = kit(rel);
      expect(text, rel).toContain("pinned kit commit");
      expect(text, rel).toContain("unpinned");
      expect(text, rel).toContain("npx");
      expect(text, rel).toContain("CLI");
    }
  });

  it("queues saturated capacity instead of retrying in a tight loop", () => {
    for (const rel of [
      "agents/orchestrator.md",
      "skills/review/SKILL.md",
      "skills/parallel-work/SKILL.md",
    ]) {
      const text = kit(rel);
      expect(text, rel).toContain("queue the wave");
      expect(text, rel).toContain("waves of at most 6");
    }
  });

  it("shares one pinned context block across briefs and keeps briefs short", () => {
    for (const rel of [
      "agents/orchestrator.md",
      "skills/review/SKILL.md",
      "skills/parallel-work/SKILL.md",
    ]) {
      const text = kit(rel);
      expect(text, rel).toContain("pinned context block");
    }
    expect(kit("skills/parallel-work/SKILL.md")).toContain(
      "Keep the brief short",
    );
  });

  it("reports planned lenses explicitly and treats preset gaps as product choice", () => {
    for (const rel of ["skills/review/SKILL.md", "skills/review/lenses.md"]) {
      const text = kit(rel);
      expect(text, rel).toContain("skipped-planned");
      expect(text, rel).toContain("never silent");
      expect(text, rel).toContain("product choice");
    }
  });

  it("passes --provider for the active tool and verifies the printed match", () => {
    for (const rel of [
      "agents/orchestrator.md",
      "skills/orchestrate/SKILL.md",
      "skills/review/SKILL.md",
      "skills/parallel-work/SKILL.md",
      "skills/review/lenses.md",
      "skills/implement/SKILL.md",
    ]) {
      const text = kit(rel);
      expect(text, rel).toContain("--provider");
      expect(text, rel).toContain("matches the active tool");
    }
  });

  it("names the session-tool-differs-from-repo-default trap with a Muse/Cursor example", () => {
    const text = kit("skills/orchestrate/SKILL.md");
    expect(text).toContain("Muse");
    expect(text).toContain("Cursor-default");
  });

  it("uses the installed locked CLI outside zedkit sources, building only there", () => {
    for (const rel of [
      "agents/orchestrator.md",
      "skills/orchestrate/SKILL.md",
      "skills/review/SKILL.md",
    ]) {
      const text = kit(rel);
      expect(text, rel).toContain("installed version-locked CLI");
      expect(text, rel).toContain("pinned kit commit");
    }
  });

  it("holds provenance and precheck findings to their evidence bar", () => {
    const review = kit("skills/review/SKILL.md");
    expect(review).toContain("upstream source and diff comparison");
    expect(review).toContain("PR description alone is not proof");
    expect(review).toContain("starts from `standard`");
  });

  it("leftover command stubs deprecate in place and still run the original skill", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const leftovers = deprecatedCommandNames(manifest.value);
    expect(leftovers.length).toBeGreaterThan(0);
    for (const stem of leftovers) {
      const text = readFileSync(join(kitDir(), "commands", `${stem}.md`), "utf8");
      expect(text, stem).toContain(
        `Deprecated: use \`/zedkit-ai <request>\`. Forwarding as route \`${stem}\`.`,
      );
      expect(text, stem).toContain("$ARGUMENTS");
      const skill = stem === "improve-config" ? "rules-upkeep" : stem;
      expect(text, stem).toContain(`\`${skill}\``);
      expect(text, stem).not.toMatch(/\bspawn\b/);
      expect(text, stem).not.toContain("tokenomics");
      expect(text, stem).not.toContain("zedkit-ai route");
      expect(text, stem).not.toContain("run the `zedkit-ai` skill");
    }
    const entry = readFileSync(join(kitDir(), "commands", "zedkit-ai.md"), "utf8");
    expect(entry).not.toContain("Deprecated:");
  });
});
