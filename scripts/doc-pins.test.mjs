import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  PINNED_FILES,
  collectVersions,
  findMismatches,
  rewritePins,
} from "./doc-pins.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..");
const script = join(here, "doc-pins.mjs");

const VERSIONS = new Map([
  ["@zedtech/zedkit-ai", "1.2.0"],
  ["@zedtech/zedkit-core", "1.0.1"],
]);

const WALKTHROUGH = [
  "This guide targets `@zedtech/zedkit-ai` **1.1.2** (current).",
  "Every command pins it with `@1.1.2`; drop the suffix to float.",
  "Add `@zedtech/zedkit-ai@1.1.2` if missing or not exactly at 1.1.2.",
  "caret range (`^1.1.2`) that floats. Already on 1.1.x? Coming from 0.12.",
  "Unrelated: vitest **3.2.0** and `@zedtech/zedkit-core@1.0.1`.",
  "",
].join("\n");

function scratch(t, prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function writePkg(root, folder, pkg) {
  const dir = join(root, "packages", folder);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`);
}

function writePinned(root, rel, text) {
  const path = join(root, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
  return path;
}

function run(args, cwd = repo) {
  return spawnSync(process.execPath, [script, ...args], { encoding: "utf8", cwd });
}

test("rewrites qualified @zedtech/zedkit-<pkg>@X.Y.Z pins", () => {
  const out = rewritePins("npx @zedtech/zedkit-ai@1.1.2 setup\n", VERSIONS);
  assert.equal(out, "npx @zedtech/zedkit-ai@1.2.0 setup\n");
});

test("rewrites unqualified statement versions tied to that pin", () => {
  const out = rewritePins(WALKTHROUGH, VERSIONS);
  assert.match(out, /\*\*1\.2\.0\*\*/);
  assert.match(out, /`@1\.2\.0`/);
  assert.match(out, /\^1\.2\.0/);
  assert.match(out, /exactly at 1\.2\.0/);
  assert.match(out, /@zedtech\/zedkit-ai@1\.2\.0/);
});

test("leaves unrelated version numbers untouched", () => {
  const out = rewritePins(WALKTHROUGH, VERSIONS);
  assert.match(out, /Already on 1\.1\.x\?/);
  assert.match(out, /Coming from 0\.12\./);
  assert.match(out, /vitest \*\*3\.2\.0\*\*/);
  assert.match(out, /@zedtech\/zedkit-core@1\.0\.1/);
});

test("is idempotent when pins already match", () => {
  const once = rewritePins(WALKTHROUGH, VERSIONS);
  assert.equal(rewritePins(once, VERSIONS), once);
});

test("check reports file:line with expected and actual", () => {
  const rel = "apps/docs/prose/guides/ai/setup.mdx";
  const hits = findMismatches(WALKTHROUGH, rel, VERSIONS);
  assert.ok(hits.length > 0, "expected at least one mismatch");
  assert.ok(
    hits.some((hit) => hit.rel === rel && hit.line === 3 && hit.expected === "1.2.0" && hit.actual === "1.1.2"),
    JSON.stringify(hits),
  );
});

test("collectVersions skips private packages", (t) => {
  const root = scratch(t, "zk-doc-pins-priv-");
  writePkg(root, "ai", { name: "@zedtech/zedkit-ai", version: "9.9.9" });
  writePkg(root, "docs", { name: "@zedtech/zedkit-docs", version: "0.0.1", private: true });
  const versions = collectVersions(root);
  assert.equal(versions.get("@zedtech/zedkit-ai"), "9.9.9");
  assert.equal(versions.has("@zedtech/zedkit-docs"), false);
});

test("write and check against a fixture tree", (t) => {
  const root = scratch(t, "zk-doc-pins-fix-");
  writePkg(root, "ai", { name: "@zedtech/zedkit-ai", version: "9.9.9" });
  const contents = Object.fromEntries(PINNED_FILES.map((rel) => [rel, WALKTHROUGH]));
  for (const [rel, text] of Object.entries(contents)) writePinned(root, rel, text);

  const failed = run(["check", "--root", root]);
  assert.equal(failed.status, 1);
  assert.match(failed.stderr, /apps\/docs\/prose\/guides\/ai\/setup\.mdx:1: expected 9\.9\.9, actual 1\.1\.2/);
  assert.notEqual(failed.stdout.trim(), "ok");

  const wrote = run(["write", "--root", root]);
  assert.equal(wrote.status, 0, wrote.stderr);
  for (const rel of PINNED_FILES) {
    const text = readFileSync(join(root, rel), "utf8");
    assert.match(text, /@zedtech\/zedkit-ai@9\.9\.9/);
    assert.match(text, /\*\*9\.9\.9\*\*/);
    assert.match(text, /Already on 1\.1\.x\?/);
    assert.equal(text.endsWith("\n"), true);
  }

  const ok = run(["check", "--root", root]);
  assert.equal(ok.status, 0, ok.stderr);
  assert.equal(ok.stdout.trim(), "ok");

  const again = run(["write", "--root", root]);
  assert.equal(again.status, 0, again.stderr);
  assert.match(again.stdout, /unchanged/);
});

test("this repo's pins match package versions", () => {
  const result = run(["check"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), "ok");
});

test("pinned walkthroughs use covered unqualified forms (exactly at X, not at exactly `X`)", () => {
  for (const rel of PINNED_FILES) {
    const text = readFileSync(join(repo, rel), "utf8");
    assert.equal(text.includes("at exactly `"), false, rel);
  }
});

test("changeset:version rewrites pins after catalog build", () => {
  const pkg = JSON.parse(readFileSync(join(repo, "package.json"), "utf8"));
  assert.equal(
    pkg.scripts["changeset:version"],
    "changeset version && node scripts/catalog.mjs build && node scripts/doc-pins.mjs write",
  );
});
