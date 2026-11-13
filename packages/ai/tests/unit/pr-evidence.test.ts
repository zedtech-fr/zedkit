import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";

const CANONICAL =
  "Required when any non-test `*.tsx` / `*.jsx` / `*.css` changed (mixed PRs include it; omit on test-only and non-UI). Link the visual-verify run record (`evidence/<branch>/manifest.json`) and linked/contact-sheet PNGs. Links, not inlined binaries.";

describe("pr skill Evidence contract", () => {
  it("uses one canonical Evidence rule in the template and the Evidence section", () => {
    const pr = readFileSync(join(kitDir(), "skills", "pr", "SKILL.md"), "utf8");
    expect(pr).toContain("## Evidence");
    expect(pr.split(CANONICAL)).toHaveLength(3);
    expect(pr).toContain("![short alt of the previous UI]");
    expect(pr).toContain("Give alt text on embedded Before/After PNGs");
  });

  it("does not cite a nonexistent evidence command or a producer-less summary.md", () => {
    const pr = readFileSync(join(kitDir(), "skills", "pr", "SKILL.md"), "utf8");
    expect(pr).not.toContain("zedkit-ai evidence");
    expect(pr).not.toContain("summary.md");
    expect(pr).not.toContain("published PNGs");
  });

  it("tells implement that a UI PR body's ## Evidence follows skill pr", () => {
    const implement = readFileSync(join(kitDir(), "skills", "implement", "SKILL.md"), "utf8");
    expect(implement).toContain("<!-- if:skill=pr -->");
    expect(implement).toContain("## Evidence");
    expect(implement).toContain("skill `pr`");
    expect(implement).toContain("`*.tsx`/`*.jsx`/`*.css` outside tests");
  });

  it("lists the pr (and implement) modification in THIRD_PARTY_NOTICES", () => {
    const notices = readFileSync(join(kitDir(), "THIRD_PARTY_NOTICES.md"), "utf8");
    expect(notices).toContain("`pr/SKILL.md`");
    expect(notices).toContain("non-test `*.tsx` / `*.jsx` / `*.css`");
    expect(notices).toContain("linked/contact-sheet PNGs");
    expect(notices).toContain("follows skill `pr`");
  });
});
