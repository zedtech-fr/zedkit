import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  HOME_FIRST_LOAD_GZIP_BUDGET,
  budgetErrors,
  collectFirstLoadChunkPaths,
  measureFirstLoadGzip,
} from "./first-load-budget.mjs";
import { checkFirstLoadBudget } from "./check-first-load-budget.mjs";

test("collectFirstLoadChunkPaths ignores lazy preload scripts", () => {
  const html = `<!doctype html><head>
<script src="/_next/static/chunks/a.js"></script>
<link rel="preload" as="script" href="/_next/static/chunks/lazy.js"/>
</head><body></body>`;
  assert.deepEqual(collectFirstLoadChunkPaths(html), ["/_next/static/chunks/a.js"]);
});

test("collectFirstLoadChunkPaths includes turbopack bootstrap chunks", () => {
  const html = `<head><script src="/_next/static/chunks/a.js"></script></head>
<body><script id="_R_">(globalThis["TURBOPACK"]||[]).push({"otherChunks":["static/chunks/b.js"]});</script></body>`;
  assert.deepEqual(collectFirstLoadChunkPaths(html).sort(), [
    "/_next/static/chunks/a.js",
    "/_next/static/chunks/b.js",
  ]);
});

test("budgetErrors fails when gzip exceeds the ceiling", () => {
  const errors = budgetErrors({ label: "test", gzipBytes: 200, budget: 100 });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /budget 100/);
});

test("measureFirstLoadGzip sums per-chunk gzip sizes", () => {
  const dir = mkdtempSync(join(tmpdir(), "zk-first-load-"));
  mkdirSync(join(dir, "_next/static/chunks"), { recursive: true });
  writeFileSync(join(dir, "index.html"), `<head><script src="/_next/static/chunks/a.js"></script></head>`);
  writeFileSync(join(dir, "_next/static/chunks/a.js"), "console.log('a');");
  const { gzipBytes, paths } = measureFirstLoadGzip(dir, "index.html");
  assert.equal(paths.length, 1);
  assert.ok(gzipBytes > 0);
  assert.ok(gzipBytes < HOME_FIRST_LOAD_GZIP_BUDGET);
});

test("checkFirstLoadBudget passes on a tiny fixture", () => {
  const dir = mkdtempSync(join(tmpdir(), "zk-first-load-"));
  mkdirSync(join(dir, "_next/static/chunks"), { recursive: true });
  writeFileSync(join(dir, "index.html"), `<head><script src="/_next/static/chunks/a.js"></script></head>`);
  writeFileSync(join(dir, "_next/static/chunks/a.js"), "x");
  const result = checkFirstLoadBudget(dir);
  assert.equal(result.ok, true);
});

test("a heavy first-load chunk fails a tight budget", () => {
  const dir = mkdtempSync(join(tmpdir(), "zk-first-load-"));
  mkdirSync(join(dir, "_next/static/chunks"), { recursive: true });
  writeFileSync(join(dir, "index.html"), `<head><script src="/_next/static/chunks/a.js"></script></head>`);
  writeFileSync(join(dir, "_next/static/chunks/a.js"), "x".repeat(50_000));
  const { gzipBytes } = measureFirstLoadGzip(dir, "index.html");
  const errors = budgetErrors({ label: "fixture", gzipBytes, budget: gzipBytes - 1 });
  assert.ok(errors.length > 0);
});
