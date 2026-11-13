import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const spec = readFileSync(
  fileURLToPath(new URL("../tests/all-routes-a11y.spec.ts", import.meta.url)),
  "utf8",
);

describe("all-routes-a11y axe filter", () => {
  it("runs the four DoD axe tags including wcag2aa (color-contrast)", () => {
    const tagsCall = spec.match(/\.withTags\(\[([^\]]+)\]\)/u);
    assert.ok(tagsCall, "missing AxeBuilder.withTags([...])");
    const listed = tagsCall[1];
    assert.match(listed, /"wcag2a"/u);
    assert.match(listed, /"wcag2aa"/u);
    assert.match(listed, /"wcag21aa"/u);
    assert.match(listed, /"wcag22aa"/u);
  });

  it("fails serious and critical impacts, the filter a lowered contrast ratio hits", () => {
    assert.match(
      spec,
      /if \(violation\.impact !== "serious" && violation\.impact !== "critical"\) continue;/u,
    );
  });

  it("does not disable the color-contrast rule", () => {
    assert.doesNotMatch(spec, /disableRules\([^)]*color-contrast/u);
  });
});
