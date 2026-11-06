import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import test from "node:test";
import { formatCoverageSummary } from "./coverage-summary.mjs";

const script = fileURLToPath(new URL("./coverage-summary.mjs", import.meta.url));

const metric = (covered, total) => ({
  total,
  covered,
  skipped: 0,
  pct: total === 0 ? 100 : (covered / total) * 100,
});

const file = (lines, statements, functions, branches) => ({
  lines: metric(...lines),
  statements: metric(...statements),
  functions: metric(...functions),
  branches: metric(...branches),
});

test("groups files by package and keeps the workspace total", () => {
  const md = formatCoverageSummary({
    total: file([9, 10], [9, 10], [4, 5], [3, 4]),
    "packages/ui/src/input.tsx": file([8, 10], [8, 10], [3, 4], [2, 3]),
    "packages/core/src/try-catch.ts": file([1, 1], [1, 1], [1, 1], [1, 1]),
  });
  assert.match(md, /^## Coverage$/m);
  assert.match(md, /\| lines \| 90 \| 9\/10 \|/);
  assert.match(md, /## Coverage by package/);
  assert.match(md, /\| core \| 100 \| 100 \| 100 \| 100 \|/);
  assert.match(md, /\| ui \| 80 \| 80 \| 75 \| 66\.67 \|/);
  assert.match(md, /\| \*\*total\*\* \| 90 \| 90 \| 80 \| 75 \|/);
});

test("resolves package names from absolute and Windows paths", () => {
  const md = formatCoverageSummary({
    total: file([2, 2], [2, 2], [2, 2], [2, 2]),
    "/data/zk-lanes/quality/packages/flags/src/index.ts": file(
      [1, 1],
      [1, 1],
      [1, 1],
      [1, 1],
    ),
    "C:\\repo\\packages\\seo\\src\\index.ts": file([1, 1], [1, 1], [1, 1], [1, 1]),
  });
  assert.match(md, /\| flags \| 100 \| 100 \| 100 \| 100 \|/);
  assert.match(md, /\| seo \| 100 \| 100 \| 100 \| 100 \|/);
});

test("sums two files in the same package from covered/total, not by averaging pct", () => {
  const md = formatCoverageSummary({
    total: file([5, 10], [5, 10], [5, 10], [5, 10]),
    "packages/i18n/src/a.ts": file([1, 8], [1, 8], [1, 8], [1, 8]),
    "packages/i18n/src/b.ts": file([4, 2], [4, 2], [4, 2], [4, 2]),
  });
  // 5/10 = 50, not the average of 12.5 and 200
  assert.match(md, /\| i18n \| 50 \| 50 \| 50 \| 50 \|/);
});

test("omits files outside packages and never treats total as a package", () => {
  const md = formatCoverageSummary({
    total: file([1, 1], [1, 1], [1, 1], [1, 1]),
    "apps/docs/src/page.tsx": file([0, 1], [0, 1], [0, 1], [0, 1]),
    "packages/ui": file([0, 1], [0, 1], [0, 1], [0, 1]),
  });
  assert.doesNotMatch(md, /\| ui \|/);
  assert.doesNotMatch(md, /\| docs \|/);
  assert.doesNotMatch(md, /\| total \|/);
  assert.match(md, /\| \*\*total\*\* \| 100 \| 100 \| 100 \| 100 \|/);
});

test("zero-total metrics print 100 and missing metrics count as empty", () => {
  const md = formatCoverageSummary({
    total: {
      lines: metric(0, 0),
      statements: metric(0, 0),
      functions: metric(0, 0),
      branches: metric(0, 0),
    },
    "packages/nest/src/empty.ts": { lines: metric(0, 0) },
  });
  assert.match(md, /\| nest \| 100 \| 100 \| 100 \| 100 \|/);
  assert.match(md, /\| \*\*total\*\* \| 100 \| 100 \| 100 \| 100 \|/);
});

test("rejects a non-object summary", () => {
  assert.throws(() => formatCoverageSummary(null), TypeError);
  assert.throws(() => formatCoverageSummary([]), TypeError);
});

test("CLI writes the same markdown as the formatter", () => {
  const dir = mkdtempSync(join(tmpdir(), "coverage-summary-"));
  const summary = {
    total: file([1, 1], [1, 1], [1, 1], [1, 1]),
    "packages/core/src/index.ts": file([1, 1], [1, 1], [1, 1], [1, 1]),
  };
  const path = join(dir, "coverage-summary.json");
  writeFileSync(path, JSON.stringify(summary));
  const out = execFileSync(process.execPath, [script, path], { encoding: "utf8" });
  assert.equal(out, formatCoverageSummary(summary));
});
