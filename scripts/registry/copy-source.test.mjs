import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { checkCopySourceFamily, checkCopySourceFamilyTheme } from "./copy-source.mjs";
import { expectedRegistryThemeFromStyles } from "./theme-tokens.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const registry = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));
const css = readFileSync(join(root, "packages/ui/src/styles.css"), "utf8");
const expected = expectedRegistryThemeFromStyles(css);

/** StatusLabel brick family (#420): composed label + kit siblings + theme slices. */
const STATUS_FAMILY = ["status-label", "status-dot", "checkmark"];

test("status family uses kit registry slugs for siblings", () => {
  assert.deepEqual(checkCopySourceFamily(registry, STATUS_FAMILY), []);
  const label = registry.items.find((item) => item.name === "status-label");
  assert.deepEqual(label.registryDependencies, [
    "zedtech-fr/zedkit/checkmark",
    "zedtech-fr/zedkit/status-dot",
    "utils",
  ]);
});

test("status family ships cssVars/css needed without npm styles.css", () => {
  assert.deepEqual(checkCopySourceFamilyTheme(registry, expected, STATUS_FAMILY), []);
  const dot = registry.items.find((item) => item.name === "status-dot");
  const check = registry.items.find((item) => item.name === "checkmark");
  assert.deepEqual(dot.cssVars, expected["status-dot"].cssVars);
  assert.deepEqual(check.cssVars, expected.checkmark.cssVars);
  assert.deepEqual(check.css, expected.checkmark.css);
});

test("bare kit sibling names are rejected for the status family", () => {
  const broken = JSON.parse(JSON.stringify(registry));
  const label = broken.items.find((item) => item.name === "status-label");
  label.registryDependencies = ["checkmark", "status-dot", "utils"];
  assert.match(checkCopySourceFamily(broken, STATUS_FAMILY).join("\n"), /use zedtech-fr\/zedkit\/checkmark/);
});
