import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { installKit } from "#install.js";
import { kitDir, readManifest } from "#kit.js";
import { validateKit } from "#validate.js";
import { failingIssues, tempDir } from "./helpers.js";

function read(rel: string): string {
  return readFileSync(join(kitDir(), rel), "utf8");
}

/** Quiet-glass HSL channels from this repo's Glass identity — must stay out of kit text. */
const QUIET_GLASS_CHANNELS = [
  "220 60% 97%",
  "224 45% 12%",
  "243 70% 46%",
  "262 85% 70%",
] as const;

describe("compose-ui skill", () => {
  it("has valid frontmatter matching the folder name and a trigger", () => {
    const raw = read("skills/compose-ui/SKILL.md");
    expect(/^name:\s*compose-ui\s*$/m.test(raw)).toBe(true);
    const description = /^description:\s*"([^"]+)"/m.exec(raw)?.[1] ?? "";
    expect(description).toMatch(/Use when/);
    expect(description.toLowerCase()).toContain("persona chain");
    expect(description).not.toContain("\n");
  });

  it("requires the brief in chain order before any UI edit", () => {
    const text = read("skills/compose-ui/SKILL.md").replace(/\s+/g, " ").toLowerCase();
    const order = ["métier", "client personas", "customers", "customer personas", "ui decisions"].map((word) =>
      text.indexOf(word),
    );
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(text).toContain("before any ui edit");
    expect(text).toContain("because");
  });

  it("encodes the art-direction rules", () => {
    const text = read("skills/compose-ui/SKILL.md").replace(/\s+/g, " ").toLowerCase();
    for (const rule of [
      "composition per use case",
      "one focal point per band",
      "glass is selective",
      "page, specimen stage, overlay",
      "type roles, not heading levels",
      "16px minimum belongs to form controls",
      "adaptive interview",
    ]) {
      expect(text, rule).toContain(rule);
    }
  });

  it("ships in setup and core, not starter, and ui-designer points at it", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const { presets } = manifest.value;
    expect(presets.setup).toContain("compose-ui");
    expect(presets.core).toContain("compose-ui");
    expect(presets.starter).not.toContain("compose-ui");
    expect(read("agents/ui-designer.md")).toContain("/compose-ui");
    expect(read("skills/compose-ui/SKILL.md")).toContain("design-policy.md");
    expect(read("skills/implement/SKILL.md")).toContain("design-policy.md");
    expect(read("skills/review/SKILL.md")).toContain("design-policy.md");
    expect(read("skills/setup-ai/design-policy.md")).toContain("p-4");
    expect(read("skills/setup-ai/design-policy.md")).toContain("fails closed");
    expect(read("skills/setup-ai/design-policy.md")).toContain("min-w-zero");
    expect(read("skills/setup-ai/design-policy.md")).toContain("min-width: 0");
    expect(read("skills/setup-ai/design-policy.md")).toContain("may share one value");
    expect(read("skills/setup-ai/design-policy.md")).toContain("named, authorized removal");
    expect(read("skills/setup-ai/design-policy.md")).toContain("kit-owned files");
    expect(read("skills/setup-ai/design-policy.md")).toContain("recorded a yes");
    expect(read("skills/setup-ai/design-policy.md")).toContain("semantic-only");
    expect(read("skills/setup-ai/design-policy.md")).toContain("source: owner");
    expect(read("skills/setup-ai/design-policy.md")).toContain("no CLI flag");
    expect(read("skills/setup-ai/design-policy.md")).not.toContain("Supersede it with this file");
    expect(read("skills/setup-ai/design-policy.md")).not.toContain("do not keep that rule");
    expect(read("skills/setup-ai/design-policy.md")).not.toContain("--semantic");
    expect(read("skills/setup-ai/design-policy.md")).not.toContain("One name per shared value");
    expect(read("skills/setup-ai/design-policy.md")).not.toContain("above zero");
    expect(read("skills/setup-ai/design-policy.md")).not.toContain("report that constraint and stop");
    expect(read("agents/ui-designer.md")).toContain("spells a number");
  });

  it("kit pointers name the persona chain behind compose-ui conditionals", () => {
    const chain = "client business";
    const files = [
      "AGENTS.template.md",
      "agents/orchestrator.md",
      "agents/copywriter.md",
      "agents/verifier.md",
      "skills/definition-of-done/SKILL.md",
      "skills/review/lenses.md",
      "skills/implement/SKILL.md",
    ];
    for (const rel of files) {
      const raw = read(rel);
      expect(raw, rel).toContain("if:skill=compose-ui");
      expect(raw, rel).toMatch(/compose-ui/);
      expect(raw.toLowerCase(), rel).toMatch(/persona/);
    }
    expect(read("AGENTS.template.md")).toContain(chain);
    expect(read("skills/definition-of-done/SKILL.md")).toContain(chain);
  });

  it("installs closed and valid in every preset that carries it", () => {
    for (const preset of ["setup", "core", "full"]) {
      const dest = tempDir();
      const result = installKit({ dest, preset, providers: [] });
      expect(result.ok, preset).toBe(true);
      expect(failingIssues(validateKit(join(dest, ".agents"))), preset).toEqual([]);
      expect(readFileSync(join(dest, ".agents", "skills", "compose-ui", "SKILL.md"), "utf8")).toContain("compose-ui");
      expect(readFileSync(join(dest, ".agents", "skills", "setup-ai", "design-policy.md"), "utf8")).toContain("role");
      expect(readFileSync(join(dest, "AGENTS.md"), "utf8")).toContain("persona chain");
    }
  });

  it("tells the agent to follow the host visual contract named in nested AGENTS.md", () => {
    const text = read("skills/compose-ui/SKILL.md").replace(/\s+/g, " ").toLowerCase();
    expect(text).toMatch(/host(?:'s)? visual contract/);
    expect(text).toMatch(/nested [`']?agents\.md[`']?/);
    expect(text).toMatch(/page fill|page and text roles/);
    expect(text).toContain("body text");
  });

  it("keeps accent off page fill and body text unless the host contract says so", () => {
    const text = read("skills/compose-ui/SKILL.md").replace(/\s+/g, " ").toLowerCase();
    expect(text).toContain("accent");
    expect(text).toMatch(/page background|page fill/);
    expect(text).toContain("body text");
    expect(text).toMatch(/unless (?:that |the )?contract says so/);
  });

  it("keeps this-repo and product URLs out of the shipped skill", () => {
    const text = read("skills/compose-ui/SKILL.md");
    expect(text).not.toContain("docs/design/signature.md");
    expect(text).not.toContain("zedkit.app");
    expect(text).not.toContain("apps/docs");
  });

  it("does not ship quiet-glass colour channels or hex literals", () => {
    const text = read("skills/compose-ui/SKILL.md");
    for (const channel of QUIET_GLASS_CHANNELS) {
      expect(text, channel).not.toContain(channel);
    }
    expect(text).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it("leaves design-policy colour-agnostic", () => {
    const policy = read("skills/setup-ai/design-policy.md");
    expect(policy).toContain("does not decide");
    expect(policy).toContain("Exact spacing, type, color");
    expect(policy).not.toContain("zedkit.app");
    for (const channel of QUIET_GLASS_CHANNELS) {
      expect(policy, channel).not.toContain(channel);
    }
  });

  it("keeps the use-signature pointer behind its install conditional", () => {
    const raw = read("skills/compose-ui/SKILL.md");
    expect(raw).toMatch(/<!-- if:skill=use-signature -->[\s\S]*use-signature[\s\S]*<!-- \/if -->/);
  });

  it("strips the use-signature pointer on presets that do not ship that skill", () => {
    for (const preset of ["setup", "core"]) {
      const dest = tempDir();
      const result = installKit({ dest, preset, providers: [] });
      expect(result.ok, preset).toBe(true);
      const installed = readFileSync(
        join(dest, ".agents", "skills", "compose-ui", "SKILL.md"),
        "utf8",
      );
      expect(installed, preset).not.toContain("use-signature");
      expect(installed, preset).not.toContain("<!-- if:");
    }
  });

  it("starter stays closed: no compose-ui install and no leftover pointer", () => {
    const dest = tempDir();
    const result = installKit({ dest, preset: "starter", providers: [] });
    expect(result.ok).toBe(true);
    expect(failingIssues(validateKit(join(dest, ".agents")))).toEqual([]);
    expect(existsSync(join(dest, ".agents", "skills", "compose-ui"))).toBe(false);
    expect(readFileSync(join(dest, ".agents", "skills", "setup-ai", "design-policy.md"), "utf8")).toContain("p-4");
    const agents = readFileSync(join(dest, "AGENTS.md"), "utf8");
    expect(agents).not.toMatch(/compose-ui/);
    expect(agents).not.toContain("persona chain");
    const orchestrator = readFileSync(join(dest, ".agents", "agents", "orchestrator.md"), "utf8");
    expect(orchestrator).not.toMatch(/compose-ui/);
  });
});
