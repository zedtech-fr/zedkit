import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

// eslint-disable-next-line no-restricted-imports -- repo-root registry.json loader (same as check.mjs)
import { loadRegistryBrickNames } from "../../../scripts/registry/catalog.mjs";
import { registryJsonSmokePathsFromNames } from "./registry-smoke-urls.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, "..");
const ROOT = join(APP, "..", "..");

test("registryJsonSmokePathsFromNames matches registry.json and generated registry-site", () => {
  const names = loadRegistryBrickNames(ROOT);
  const siteText = readFileSync(join(APP, "content", "registry-site.ts"), "utf8");
  const match = /export const registryBrickNames: string\[\] = (\[[\s\S]*?\]);/.exec(siteText);
  assert.ok(match, "registry-site.ts export");
  const siteNames = JSON.parse(match[1]);
  assert.deepEqual(siteNames, names);
  assert.deepEqual(registryJsonSmokePathsFromNames(siteNames), registryJsonSmokePathsFromNames(names));
});
