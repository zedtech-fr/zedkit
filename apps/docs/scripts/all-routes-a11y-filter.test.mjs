import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const spec = readFileSync(
  fileURLToPath(new URL("../tests/all-routes-a11y.spec.ts", import.meta.url)),
  "utf8",
);

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
