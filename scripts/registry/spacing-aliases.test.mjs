import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const css = readFileSync(join(root, "packages/ui/src/styles.css"), "utf8");
const groups = JSON.parse(readFileSync(join(root, "scripts/registry/spacing-aliases.json"), "utf8"));

function cssSpacingTokens() {
  const found = new Map();
  for (const match of css.matchAll(/^\s*(--spacing-[a-z0-9-]+):\s*([^;]+);/gm)) {
    assert.ok(!found.has(match[1]), `styles.css defines ${match[1]} twice`);
    found.set(match[1], match[2].trim());
  }
  return found;
}

test("every --spacing-* token is mapped exactly once with a matching value", () => {
  const inCss = cssSpacingTokens();
  const seen = new Map();
  for (const group of groups) {
    for (const token of group.tokens) {
      assert.ok(inCss.has(token), `${token} is in the alias map but not in styles.css`);
      assert.equal(
        inCss.get(token),
        group.value,
        `${token} is ${inCss.get(token)} in styles.css but ${group.value} in the map`,
      );
      assert.ok(!seen.has(token), `${token} is mapped twice`);
      seen.set(token, group.canonical);
    }
  }
  for (const [token, value] of inCss) {
    assert.ok(seen.has(token), `${token} (${value}) is not in spacing-aliases.json: use canonical or extend the map`);
  }
});

test("shared values point at their Tailwind scale step, singletons at themselves", () => {
  for (const group of groups) {
    if (group.tokens.length > 1) {
      assert.match(group.canonical, /^\d+(\.5)?$/, `${group.value}: canonical must be a scale step`);
      const expected = `${parseFloat(group.canonical) * 0.25}rem`;
      assert.equal(group.value, expected, `${group.value}: step ${group.canonical} computes to ${expected}`);
    } else {
      assert.equal(group.canonical, group.tokens[0], `${group.value}: singleton canonical must be itself`);
    }
  }
});

test("kit sources use size-4, not the deprecated size-icon-control alias", () => {
  const srcDir = join(root, "packages/ui/src");
  const hits = [];
  for (const name of readdirSync(srcDir)) {
    if (!name.endsWith(".ts") && !name.endsWith(".tsx")) continue;
    if (readFileSync(join(srcDir, name), "utf8").includes("size-icon-control")) hits.push(name);
  }
  assert.deepEqual(hits, []);
});
