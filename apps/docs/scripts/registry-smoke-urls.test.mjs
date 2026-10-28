import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

// eslint-disable-next-line no-restricted-imports -- repo-root registry.json loader (same as check.mjs)
import { loadRegistryBrickNames } from "../../../scripts/registry/catalog.mjs";
import { registryJsonSmokePaths } from "../lib/registry-smoke-urls.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

test("registryJsonSmokePaths lists every registry.json item", () => {
  const expected = loadRegistryBrickNames(ROOT).map((name) => `/r/${name}.json`);
  assert.deepEqual(registryJsonSmokePaths(), expected);
});
