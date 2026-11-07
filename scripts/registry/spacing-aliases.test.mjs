import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
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

const DEPRECATED_1REM_CLASSES = [
  "gap-dialog-gap",
  "gap-field-group-nested",
  "h-data-table-skeleton-height",
  "ml-field-error-indent",
  "mt-card-section",
  "p-dialog-gap",
  "p-field-label-inset",
  "px-button-inline",
  "right-overlay-close-offset",
  "size-icon-control",
  "size-switch-thumb",
  "top-overlay-close-offset",
  "translate-x-switch-travel",
  "h-field-separator",
  "h-switch-track-height",
  "size-status-dot",
  "space-y-card-lines",
  "mt-tabs-content-gap",
  "space-y-form-item-gap",
  "px-field-separator-inline",
  "gap-field-inline",
  "gap-drawer-footer-gap",
  "space-x-dialog-footer-gap",
  "gap-button-gap",
  "px-select-item-inline",
  "pl-select-item-inline",
  "right-select-item-inline",
  "px-button-inline-sm",
  "px-tabs-trigger-inline",
  "mb-field-legend-bottom",
  "gap-field",
  "gap-field-group-compact",
  "px-control-inline",
  "right-control-inline",
  "py-select-item-block",
  "gap-status-label-gap",
  "gap-field-content",
];

function walkJs(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "out" || entry.name === "dist") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walkJs(path, acc);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) acc.push(path);
  }
  return acc;
}

test("kit and docs sources do not use deprecated rem spacing aliases", () => {
  const files = [...walkJs(join(root, "packages/ui/src")), ...walkJs(join(root, "apps/docs"))];
  const hits = [];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const alias of DEPRECATED_1REM_CLASSES) {
      if (new RegExp(`(?<![A-Za-z0-9-])${alias}(?![A-Za-z0-9-])`).test(text)) {
        hits.push(`${relative(root, file)}: ${alias}`);
      }
    }
  }
  assert.deepEqual(hits, []);
});
