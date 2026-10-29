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
  "gap-detail-panel-gap",
  "gap-dialog-gap",
  "gap-field-group-nested",
  "gap-page-header-gap",
  "h-data-table-skeleton-height",
  "left-alert-icon-offset",
  "mb-drawer-handle-top",
  "ml-field-error-indent",
  "mt-card-section",
  "mt-drawer-handle-top",
  "mt-table-caption-gap",
  "p-app-shell-padding",
  "p-dialog-gap",
  "p-drawer-chrome-padding",
  "p-field-label-inset",
  "p-option-card-padding",
  "pt-drawer-chrome-padding",
  "px-alert-inline",
  "px-button-inline",
  "px-detail-panel-inline",
  "px-drawer-chrome-padding",
  "right-overlay-close-offset",
  "size-checkbox",
  "size-icon-control",
  "size-status-label-box",
  "size-switch-thumb",
  "space-y-data-table-stack",
  "top-alert-icon-offset",
  "top-overlay-close-offset",
  "translate-x-switch-travel",
  "h-field-separator",
  "h-switch-track-height",
  "gap-secret-field-gap",
  "size-status-dot",
  "space-y-card-lines",
  "mt-tabs-content-gap",
  "space-y-form-item-gap",
  "gap-data-table-pagination-gap",
  "px-field-separator-inline",
  "gap-page-header-actions-gap",
  "gap-field-inline",
  "gap-drawer-footer-gap",
  "space-x-dialog-footer-gap",
  "gap-button-gap",
  "gap-wizard-step-gap",
  "gap-y-wizard-steps-row-gap",
  "px-table-cell",
  "p-table-cell",
  "px-select-item-inline",
  "pl-select-item-inline",
  "right-select-item-inline",
  "py-control-block-lg",
  "gap-x-wizard-steps-gap",
  "px-button-inline-sm",
  "px-tabs-trigger-inline",
  "py-detail-panel-block",
  "py-alert-block",
  "gap-option-card-gap",
  "gap-option-cards-gap",
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

test("kit and docs sources use the Tailwind scale, not deprecated spacing aliases", () => {
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
