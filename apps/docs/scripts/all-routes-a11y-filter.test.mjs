import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const spec = readFileSync(
  fileURLToPath(new URL("../tests/all-routes-a11y.spec.ts", import.meta.url)),
  "utf8",
);
const fitSpec = readFileSync(
  fileURLToPath(new URL("../tests/all-routes-fit.spec.ts", import.meta.url)),
  "utf8",
);

const REQUIRED_WIDTHS = [375, 809, 1440];
const REQUIRED_HEIGHT = 900;
const VIEWS_BLOCK_RE = /const VIEWS\s*=\s*\[([\s\S]*?)\]\s*as const/u;
const VIEW_ROW_RE =
  /\{\s*width:\s*(\d+)\s*,\s*height:\s*(\d+)\s*,\s*theme:\s*['"](light|dark)['"]\s*\}/gu;

function matrixProblems(source) {
  const block = source.match(VIEWS_BLOCK_RE);
  if (!block) return ["missing VIEWS table"];
  const rows = [...block[1].matchAll(VIEW_ROW_RE)].map((match) => ({
    width: Number(match[1]),
    height: Number(match[2]),
    theme: match[3],
  }));
  if (rows.length === 0) return ["missing VIEWS table"];
  const problems = [];
  const widths = new Set(rows.map((row) => row.width));
  for (const width of REQUIRED_WIDTHS) {
    if (!widths.has(width)) problems.push(`missing width ${width}`);
  }
  for (const row of rows) {
    if (row.height !== REQUIRED_HEIGHT) {
      problems.push(`height ${row.height} at ${row.width} ${row.theme}`);
    }
  }
  return problems;
}

const TAGS_RE = /\.withTags\(\s*\[([^\]]+)\]\s*\)/u;
const IMPACT_RE =
  /if\s*\(\s*violation\.impact\s*!==\s*['"]serious['"]\s*&&\s*violation\.impact\s*!==\s*['"]critical['"]\s*\)\s*continue;/u;
const DISABLE_RE = /\bdisableRules\b/u;
const OPTIONS_RE = /\.options\s*\(/u;
const WITH_RULES_RE = /\bwithRules\b/u;
const ID_SKIP_RE = /violation\.id\s*[!=]==?\s*['"]color-contrast['"]/u;

function contrastBypass(source) {
  return DISABLE_RE.test(source) || OPTIONS_RE.test(source) || WITH_RULES_RE.test(source) || ID_SKIP_RE.test(source);
}

describe("all-routes-a11y axe filter", () => {
  it("runs wcag2a, wcag2aa, wcag21aa, and wcag22aa (color-contrast)", () => {
    const tagsCall = spec.match(TAGS_RE);
    assert.ok(tagsCall, "missing AxeBuilder.withTags([...])");
    const listed = tagsCall[1];
    assert.match(listed, /['"]wcag2a['"]/u);
    assert.match(listed, /['"]wcag2aa['"]/u);
    assert.match(listed, /['"]wcag21aa['"]/u);
    assert.match(listed, /['"]wcag22aa['"]/u);
  });

  it("fails serious and critical impacts", () => {
    assert.match(spec, IMPACT_RE);
  });

  it("still matches a single-quoted or reflowed impact filter", () => {
    assert.match(
      "if (violation.impact !== 'serious' && violation.impact !== 'critical') continue;",
      IMPACT_RE,
    );
    assert.match(
      'if ( violation.impact !== "serious" &&\n violation.impact !== "critical" ) continue;',
      IMPACT_RE,
    );
  });

  it("does not disable the color-contrast rule", () => {
    assert.equal(contrastBypass(spec), false);
  });

  it("rejects id skip, disableRules-const, .options, and withRules", () => {
    const sneaks = {
      "id skip ===": 'if (violation.id === "color-contrast") continue;',
      "id skip !==": "if (violation.id !== 'color-contrast') continue;",
      "disableRules inline": 'builder.disableRules(["color-contrast"]);',
      "disableRules const": 'const off = ["color-contrast"]; builder.disableRules(off);',
      ".options": 'builder.options({ rules: { "color-contrast": { enabled: false } } });',
      withRules: 'builder.withRules(["html-has-lang"]);',
    };
    for (const [name, src] of Object.entries(sneaks)) {
      assert.equal(contrastBypass(src), true, name);
    }
  });
});

describe("docs-render route specs share the DoD v2 matrix", () => {
  it("rejects a phone cell whose height is not 900", () => {
    const source = `const VIEWS = [
  { width: 375, height: 800, theme: "light" },
  { width: 375, height: 800, theme: "dark" },
  { width: 809, height: 900, theme: "light" },
  { width: 809, height: 900, theme: "dark" },
  { width: 1440, height: 900, theme: "light" },
  { width: 1440, height: 900, theme: "dark" },
] as const;`;
    assert.deepEqual(matrixProblems(source), [
      "height 800 at 375 light",
      "height 800 at 375 dark",
    ]);
  });

  it("rejects a table that drops a required width", () => {
    const source = `const VIEWS = [
  { width: 375, height: 900, theme: "light" },
  { width: 809, height: 900, theme: "dark" },
] as const;`;
    assert.deepEqual(matrixProblems(source), ["missing width 1440"]);
  });

  it("still matches a reflowed VIEWS row", () => {
    const source = `const VIEWS = [
  { width: 375,
    height: 900,
    theme: "light" },
  { width: 809, height: 900, theme: "dark" },
  { width: 1440, height: 900, theme: "light" },
] as const;`;
    assert.deepEqual(matrixProblems(source), []);
  });

  it("fails closed when VIEWS is missing", () => {
    assert.deepEqual(matrixProblems("const other = [];"), ["missing VIEWS table"]);
  });

  it("keeps overflow and axe specs at 375, 809, 1440 × height 900", () => {
    assert.deepEqual(matrixProblems(spec), []);
    assert.deepEqual(matrixProblems(fitSpec), []);
  });
});
