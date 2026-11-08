import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

test("check-pack rejects test, spec and story files in the ui tarball", () => {
  const script = readFileSync(join("scripts", "check-pack.sh"), "utf8");
  assert.match(script, /ui: tarball contains test\/spec\/stories sources/);
  assert.match(script, /package\/src\/\.\*\\\.\(test\|spec\|stories\)\\\./);
});
