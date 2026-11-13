import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { resolveConditionals } from "#conditional.js";
import {
  agentsForPreset,
  commandsForPreset,
  kitDir,
  kitUniverse,
  readManifest,
} from "#kit.js";
import { readLegacyHashFile, shortHash } from "#legacy.js";

const CANONICAL =
  "Required when any non-test `*.tsx` / `*.jsx` / `*.css` changed (mixed PRs include it; omit on test-only and non-UI).";

const kit = kitDir();
const pr = readFileSync(join(kit, "skills", "pr", "SKILL.md"), "utf8");
const implement = readFileSync(join(kit, "skills", "implement", "SKILL.md"), "utf8");
const notices = readFileSync(join(kit, "THIRD_PARTY_NOTICES.md"), "utf8");
const atlas = readFileSync(
  join(fileURLToPath(new URL("../../../..", import.meta.url)), ".agents", "atlas.md"),
  "utf8",
);
const template = pr.slice(pr.indexOf("## Evidence"), pr.indexOf("## Merge Danger"));
const section = pr.slice(pr.indexOf("### Evidence"));
const implementClause = notices.slice(notices.indexOf("`implement/SKILL.md`"), notices.indexOf("`pr/SKILL.md`"));
const prClause = notices.slice(notices.indexOf("`pr/SKILL.md`"), notices.indexOf("`research/SKILL.md`"));

describe("pr skill Evidence contract", () => {
  it("keeps the Evidence rule once in the section and a pointer in the template", () => {
    expect(template).toContain("## Evidence");
    expect(template).toContain("Follow ### Evidence");
    expect(template).not.toContain(CANONICAL);
    expect(pr.split(CANONICAL)).toHaveLength(2);
    expect(section).toContain(CANONICAL);
  });

  it("does not cite a nonexistent evidence command or a producer-less summary.md", () => {
    expect(pr).not.toContain("zedkit-ai evidence");
    expect(pr).not.toContain("summary.md");
    expect(pr).not.toContain("published PNGs");
    expect(pr).not.toContain("S-tier");
    expect(pr).not.toContain("A-tier");
    expect(pr).not.toContain("the manifest");
  });

  it("defines non-test, excludes docs/canvas, and names Before/After alt", () => {
    expect(section).toContain("not under `tests/` or `__tests__/`, not `*.test.*` / `*.spec.*` / `*.stories.*`");
    expect(section).toContain("Docs (`.mdx` / `.html` / `.md`), canvas/WebGL `.ts`");
    expect(section).toContain("`*.scss`");
    expect(section).toContain("`*.vue`");
    expect(section).toContain("![short alt of the previous UI]");
    expect(section).toContain("![short alt of the changed UI]");
    expect(section).toContain("Give alt text on embedded Before/After PNGs and on any embedded contact sheet");
  });

  it("tells reviewers how gitignored evidence reaches the PR", () => {
    expect(section).toContain("Paste the visual-verify stdout table");
    expect(section).toContain("Attach contact-sheet PNGs");
    expect(section).toContain("gitignored");
    expect(section).toContain("run record (`evidence/<branch>/manifest.json`)");
    expect(section).toContain("no PNG bytes, no data URIs");
    expect(section).toContain("embedded with Markdown image syntax is a link the host may render");
  });

  it("tells implement that a UI PR body's ## Evidence is required per skill pr", () => {
    expect(implement).toContain("<!-- if:skill=pr -->");
    expect(implement).toContain("<!-- /if -->");
    expect(implement).toContain("## Evidence");
    expect(implement).toContain("skill `pr`");
    expect(implement).toContain("non-test `*.tsx`/`*.jsx`/`*.css`");
    expect(implement).toContain("is required and follows skill `pr`");
    expect(implement).not.toContain("outside tests");
  });

  it("ships pr with implement on setup so the Evidence pointer is not stripped", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const setup = manifest.value.presets.setup;
    if (!Array.isArray(setup)) throw new Error("setup preset must list skills");
    expect(setup).toContain("implement");
    expect(setup).toContain("pr");
    expect(manifest.value.presetCommands?.setup ?? []).toContain("pr");
  });

  it("lists the pr (and implement) modification in THIRD_PARTY_NOTICES", () => {
    expect(implementClause).toContain("`implement/SKILL.md`");
    expect(implementClause).toContain("follows skill `pr`");
    expect(implementClause).toContain("required");
    expect(prClause).toContain("`pr/SKILL.md`");
    expect(prClause).toContain("non-test `*.tsx` / `*.jsx` / `*.css`");
    expect(prClause).toContain("contact-sheet PNGs");
    expect(prClause).not.toContain("S-tier");
    expect(prClause).not.toContain("A-tier");
  });

  it("keeps the atlas row as a pointer plus traps, not a copy of the rule", () => {
    expect(atlas).toContain("packages/ai/kit/skills/pr/SKILL.md");
    expect(atlas).not.toContain(CANONICAL);
    expect(atlas).toContain("No `zedkit-ai evidence` command");
    expect(atlas).toContain("no `summary.md` producer");
    expect(atlas).toContain("Not Visual work evidence");
    expect(atlas).toContain('Do not call the run record a "manifest"');
    expect(atlas).toContain("`evidence/` is gitignored");
  });

  it("records current pr and implement skill hashes (rerun scripts/legacy-hashes.mjs if this fails)", () => {
    const recorded = readLegacyHashFile(join(kit, "legacy-hashes.json"));
    expect(recorded.status).toBe("ok");
    if (recorded.status !== "ok") return;
    const prHashes = recorded.map.skills?.["pr/SKILL.md"] ?? [];
    const implHashes = recorded.map.skills?.["implement/SKILL.md"] ?? [];
    expect(prHashes).toContain(shortHash(pr));
    expect(implHashes).toContain(shortHash(implement));
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const universe = kitUniverse(kit);
    for (const preset of Object.keys(manifest.value.presets)) {
      const skills = manifest.value.presets[preset];
      const avail = {
        skills: new Set(skills === "*" ? universe.skills : skills),
        agents: new Set(agentsForPreset(manifest.value, preset)),
        commands: new Set(commandsForPreset(manifest.value, preset)),
      };
      expect(prHashes, `${preset} pr`).toContain(shortHash(resolveConditionals(pr, avail)));
      expect(implHashes, `${preset} implement`).toContain(shortHash(resolveConditionals(implement, avail)));
    }
  });
});
