import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const app = join(dirname(fileURLToPath(import.meta.url)), "..");

test("check-native-controls passes on the docs app tree", () => {
  const out = execFileSync("node", ["scripts/check-native-controls.mjs"], { cwd: app, encoding: "utf8" });
  assert.equal(out, "");
});
