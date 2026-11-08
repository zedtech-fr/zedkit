// C-04a: `--write` refuses any per-file/total increase and leaves the
// committed baseline untouched; decreases still write.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..");
// Spelled in parts so this fixture file does not itself count as a hit.
const BAD = 'export const x = ' + "c" + 'n("p-' + '4");\n';

function fixture(baselineFiles) {
  const root = mkdtempSync(join(tmpdir(), "zk-scale-base-"));
  mkdirSync(join(root, "scripts"), { recursive: true });
  copyFileSync(join(repo, "scripts/check-scale-baseline.mjs"), join(root, "scripts/check-scale-baseline.mjs"));
  symlinkSync(join(repo, "packages"), join(root, "packages"), "dir");
  const baseline = join(root, "scripts/scale-class-baseline.json");
  writeFileSync(baseline, `${JSON.stringify({ version: 1, total: 0, files: baselineFiles }, null, 2)}\n`);
  return { root, baseline, script: join(root, "scripts/check-scale-baseline.mjs") };
}

function run(script, args) {
  return spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
}

test("--write refuses an increase and leaves the baseline untouched", () => {
  const { root, baseline, script } = fixture({});
  writeFileSync(join(root, "app.mjs"), BAD);
  const before = readFileSync(baseline, "utf8");
  const res = run(script, ["--write"]);
  assert.equal(res.status, 1);
  assert.match(res.stderr, /app\.mjs: baseline 0, current 1/);
  assert.equal(readFileSync(baseline, "utf8"), before);
});

test("shipped sources must be zero even when the baseline would allow them (C-04b)", () => {
  const { root, script } = fixture({ "src/app.mjs": 1 });
  mkdirSync(join(root, "src"), { recursive: true });
  writeFileSync(join(root, "src/app.mjs"), BAD);
  const res = run(script, []);
  assert.equal(res.status, 1);
  assert.match(res.stderr, /shipped sources \(must be zero\)/);
  assert.match(res.stderr, /src\/app\.mjs: 1/);
});

test("--write with an equal count is a no-op success (repeat call harmless)", () => {
  const { root, baseline, script } = fixture({ "app.mjs": 1 });
  writeFileSync(join(root, "app.mjs"), BAD);
  assert.equal(run(script, ["--write"]).status, 0);
  const once = readFileSync(baseline, "utf8");
  assert.equal(run(script, ["--write"]).status, 0);
  assert.equal(readFileSync(baseline, "utf8"), once);
  assert.equal(JSON.parse(once).total, 1);
});

test("a matching baseline is an inventory, not an unfinished migration", () => {
  const { root, script } = fixture({ "app.mjs": 1 });
  writeFileSync(join(root, "app.mjs"), BAD);
  const res = run(script, []);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /inventory, not a migration verdict/);
  assert.match(res.stdout, /app\.mjs: 1/);
  assert.doesNotMatch(res.stdout + res.stderr, /not complete/);
});

test("--write still records a decrease", () => {
  const { root, baseline, script } = fixture({ "app.mjs": 1 });
  writeFileSync(join(root, "app.mjs"), 'export const x = cn("px-page-gutter");\n');
  const res = run(script, ["--write"]);
  assert.equal(res.status, 0, res.stderr);
  assert.equal(JSON.parse(readFileSync(baseline, "utf8")).total, 0);
});
