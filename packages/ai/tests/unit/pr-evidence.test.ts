import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";

const NO_EVIDENCE = `## Summary

Does a thing.

## Merge Danger

**Door:** two-way
`;

function posix(path: string): string {
  return path.replaceAll("\\", "/");
}

function isTestPath(path: string): boolean {
  const p = posix(path);
  return /(^|\/)tests?\//u.test(p) || /\.(?:test|spec)\./u.test(p);
}

function isUiSurface(path: string): boolean {
  return !isTestPath(path) && /\.(?:tsx|jsx|css)$/iu.test(posix(path));
}

function evidenceSection(body: string): string | undefined {
  const text = body.replaceAll("\r\n", "\n");
  const heading = /^## Evidence[ \t]*$/mu.exec(text);
  if (!heading) return undefined;
  const start = (heading.index ?? 0) + heading[0].length;
  const rest = text.slice(start);
  const next = /^## /mu.exec(rest);
  return (next ? rest.slice(0, next.index) : rest).trim();
}

function hits(section: string): { href: string; linked: boolean }[] {
  const found: { href: string; linked: boolean }[] = [];
  for (const match of section.matchAll(/\[[^\]]*\]\(([^)]+)\)/gu)) {
    if (match[1]) found.push({ href: match[1].trim(), linked: true });
  }
  for (const match of section.matchAll(/<(https?:[^>\s]+|[^>\s]+\.(?:md|png|json)[^>]*)>/giu)) {
    if (match[1]) found.push({ href: match[1].trim(), linked: true });
  }
  for (const match of section.matchAll(
    /(?:^|[\s`"'(])((?:https?:\/\/|\.?\.?\/)?[\w.~:@%+,/=-]*\.(?:md|png|json)(?:\?[^\s)]*)?)/giu,
  )) {
    if (match[1]) found.push({ href: match[1].trim(), linked: false });
  }
  return found;
}

function isUsableHref(href: string, linked: boolean): boolean {
  if (/^data:/iu.test(href)) return false;
  const path = (href.split(/[?#]/u)[0] ?? "").replace(/\/+$/u, "");
  const lower = path.toLowerCase();
  if (lower.endsWith(".png") || lower.endsWith(".json")) return true;
  if (!lower.endsWith("summary.md")) return false;
  // Bare `summary.md` in kit prose is not a link; a markdown href or a path is.
  return linked || lower.includes("/") || /^https?:/iu.test(href);
}

/** PR-body check: UI surfaces need a usable ## Evidence section of links. */
function checkPrEvidence({ body, files }: { body: string; files: readonly string[] }): string[] {
  if (!files.some(isUiSurface)) return [];
  const section = evidenceSection(body);
  if (section === undefined) return ["UI change needs a ## Evidence section"];
  if (section === "") return ["## Evidence is empty"];
  const issues: string[] = [];
  if (/\bdata:/iu.test(section)) {
    issues.push("## Evidence must use links, not data: URIs or inlined binaries");
  }
  if (!hits(section).some((hit) => isUsableHref(hit.href, hit.linked))) {
    issues.push("## Evidence needs a link to summary.md, a .png, or a run-record .json");
  }
  return issues;
}

describe("checkPrEvidence", () => {
  it("fails a UI change without ## Evidence and passes the same body on non-UI files", () => {
    expect(checkPrEvidence({ body: NO_EVIDENCE, files: ["src/button.tsx"] }).length).toBeGreaterThan(0);
    expect(checkPrEvidence({ body: NO_EVIDENCE, files: ["src/parse.ts"] })).toEqual([]);
  });

  it("fails UI Evidence that is empty, placeholder-only, or a data: URI", () => {
    expect(
      checkPrEvidence({
        body: "## Evidence\n\n## Merge Danger\n",
        files: ["src/button.tsx"],
      }).length,
    ).toBeGreaterThan(0);
    expect(
      checkPrEvidence({
        body: `## Evidence

- **Before:** <screenshot/output/failing test run>
  **After:** <screenshot/output/passing test run>
`,
        files: ["src/button.tsx"],
      }).length,
    ).toBeGreaterThan(0);
    expect(
      checkPrEvidence({
        body: "## Evidence\n\n- **After:** ![](data:image/png;base64,aaaa)\n",
        files: ["src/button.tsx"],
      }).length,
    ).toBeGreaterThan(0);
  });

  it("accepts a summary.md, PNG, or run-record .json link on UI files", () => {
    expect(
      checkPrEvidence({
        body: "## Evidence\n\n- [summary](summary.md)\n",
        files: ["src/button.tsx"],
      }),
    ).toEqual([]);
    expect(
      checkPrEvidence({
        body: "## Evidence\n\n- [summary](evidence/demo/summary.md)\n",
        files: ["src/button.tsx"],
      }),
    ).toEqual([]);
    expect(
      checkPrEvidence({
        body: "## Evidence\n\n- **After:** evidence/demo/after.png\n",
        files: ["src/button.tsx"],
      }),
    ).toEqual([]);
    expect(
      checkPrEvidence({
        body: "## Evidence\n\n- [run record](evidence/demo/run.json)\n",
        files: ["src/button.tsx"],
      }),
    ).toEqual([]);
  });

  it("does not require Evidence for test-only tsx, and treats Evidence as optional on non-UI", () => {
    expect(checkPrEvidence({ body: NO_EVIDENCE, files: ["src/button.test.tsx"] })).toEqual([]);
    expect(checkPrEvidence({ body: NO_EVIDENCE, files: ["src/button.spec.tsx"] })).toEqual([]);
    expect(checkPrEvidence({ body: NO_EVIDENCE, files: ["tests/preview/button.tsx"] })).toEqual([]);
    expect(
      checkPrEvidence({
        body: "## Evidence\n\n- [summary](evidence/demo/summary.md)\n",
        files: ["src/parse.ts"],
      }),
    ).toEqual([]);
  });

  it("requires Evidence for css and jsx, and for a mixed UI plus logic list", () => {
    expect(checkPrEvidence({ body: NO_EVIDENCE, files: ["src/styles.css"] }).length).toBeGreaterThan(0);
    expect(checkPrEvidence({ body: NO_EVIDENCE, files: ["src/icon.jsx"] }).length).toBeGreaterThan(0);
    expect(checkPrEvidence({ body: NO_EVIDENCE, files: ["src/parse.ts", "src/button.tsx"] }).length).toBeGreaterThan(0);
  });

  it("does not treat backtick summary.md in the copied template as Evidence", () => {
    expect(
      checkPrEvidence({
        body: `## Evidence

Required on a UI surface; omit on non-UI. Link \`summary.md\` or the visual-verify run record and published PNGs.

- **Before:** <PNG or run-record link>
  **After:** <PNG or run-record link>
`,
        files: ["src/button.tsx"],
      }).length,
    ).toBeGreaterThan(0);
  });

  it("fails a data: URI even when a PNG link is also present", () => {
    expect(
      checkPrEvidence({
        body: "## Evidence\n\n- [shot](evidence/demo/after.png)\n- ![](data:image/png;base64,aaaa)\n",
        files: ["src/button.tsx"],
      }).length,
    ).toBeGreaterThan(0);
  });
});

describe("pr skill Evidence contract", () => {
  it("requires ## Evidence on a UI surface, names summary.md or the run record, and forbids inlined binaries", () => {
    const pr = readFileSync(join(kitDir(), "skills", "pr", "SKILL.md"), "utf8");
    const folded = pr.replace(/\s+/g, " ").toLowerCase();
    expect(pr).toContain("## Evidence");
    expect(folded).toContain("required on a ui surface");
    expect(pr).toContain("summary.md");
    expect(folded).toContain("run record");
    expect(folded).toContain("inlined binaries");
    expect(pr).not.toContain("zedkit-ai route");
  });

  it("tells implement that a UI PR body's ## Evidence follows skill pr", () => {
    const implement = readFileSync(join(kitDir(), "skills", "implement", "SKILL.md"), "utf8");
    expect(implement).toContain("<!-- if:skill=pr -->");
    expect(implement).toContain("## Evidence");
    expect(implement).toContain("skill `pr`");
  });

  it("lists the pr (and implement) modification in THIRD_PARTY_NOTICES", () => {
    const notices = readFileSync(join(kitDir(), "THIRD_PARTY_NOTICES.md"), "utf8");
    expect(notices).toContain("`pr/SKILL.md`");
    expect(notices).toContain("required on a UI surface");
    expect(notices).toContain("follows skill `pr`");
  });
});
