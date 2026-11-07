import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { readLegacyHashFile } from "../dist/legacy.js";

const aiRoot = join(fileURLToPath(new URL(".", import.meta.url)), "..");

test("readLegacyHashFile keeps invalid JSON untouched when regeneration would run", () => {
  const dir = mkdtempSync(join(tmpdir(), "legacy-hashes-"));
  const path = join(dir, "legacy-hashes.json");
  const corrupt = '{ "agents": { "x": ["abc"] }, broken';
  writeFileSync(path, corrupt);
  assert.equal(readLegacyHashFile(path).status, "invalid");
  assert.equal(readFileSync(path, "utf8"), corrupt);
});

test("legacy-hashes.mjs wires readLegacyHashFile before write", () => {
  const src = readFileSync(join(aiRoot, "scripts", "legacy-hashes.mjs"), "utf8");
  assert.match(src, /readLegacyHashFile\(hashesPath\)/u);
  assert.match(src, /snapshot\.status === "invalid"/u);
});
