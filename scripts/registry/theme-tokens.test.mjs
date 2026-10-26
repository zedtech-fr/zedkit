import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { checkRegistryThemeDrift, expectedRegistryThemeFromStyles } from "./theme-tokens.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

test("expectedRegistryThemeFromStyles matches registry.json badge and drawer", () => {
  const css = readFileSync(join(root, "packages/ui/src/styles.css"), "utf8");
  const registry = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));
  const expected = expectedRegistryThemeFromStyles(css);
  const badge = registry.items.find((item) => item.name === "badge");
  const drawer = registry.items.find((item) => item.name === "drawer");
  assert.deepEqual(badge.cssVars, expected.badge.cssVars);
  assert.deepEqual(badge.css, expected.badge.css);
  assert.deepEqual(drawer.cssVars, expected.drawer.cssVars);
});

test("checkRegistryThemeDrift is clean on the repo", () => {
  assert.deepEqual(checkRegistryThemeDrift(root), []);
});
