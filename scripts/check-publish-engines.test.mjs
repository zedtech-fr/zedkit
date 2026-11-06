import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { REQUIRED_NODE_ENGINE, checkPublishEngines } from "./check-publish-engines.mjs";

test("checkPublishEngines passes when every public package declares engines.node", () => {
  const root = mkdtempSync(join(tmpdir(), "zk-engines-"));
  mkdirSync(join(root, "packages", "core"), { recursive: true });
  writeFileSync(
    join(root, "packages", "core", "package.json"),
    JSON.stringify({ name: "@zedtech/zedkit-core", engines: { node: REQUIRED_NODE_ENGINE } }),
  );
  const result = checkPublishEngines(root);
  assert.equal(result.ok, true);
});

test("checkPublishEngines fails when engines.node is missing", () => {
  const root = mkdtempSync(join(tmpdir(), "zk-engines-"));
  mkdirSync(join(root, "packages", "core"), { recursive: true });
  writeFileSync(join(root, "packages", "core", "package.json"), JSON.stringify({ name: "@zedtech/zedkit-core" }));
  const result = checkPublishEngines(root);
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /engines\.node must be/);
});
