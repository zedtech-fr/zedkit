// Ratchet for scale-step classes. The committed count is the current count.
// A file may only shrink. Growing, or leaving a stale higher count, fails.
import { lstatSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { baselineIncreases, findScaleHits } from "../packages/quality/src/scale-classes.mjs";

const root = join(import.meta.dirname, "..");
const baselinePath = join(root, "scripts/scale-class-baseline.json");
const SKIP = new Set([
  "node_modules",
  "dist",
  "out",
  ".next",
  ".turbo",
  "coverage",
  "registry",
  ".source",
  "test-results",
  ".git",
]);
const EXT = new Set([".tsx", ".jsx", ".ts", ".mts", ".cts", ".js", ".mjs", ".cjs", ".css"]);

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name) || name.startsWith(".")) continue;
    const path = join(dir, name);
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) continue;
    if (stat.isDirectory()) walk(path, out);
    else if (EXT.has(extname(path))) out.push(path);
  }
}

function currentCounts() {
  const files = [];
  walk(root, files);
  const map = new Map();
  for (const file of files) {
    const count = findScaleHits(readFileSync(file, "utf8")).length;
    if (count > 0) map.set(relative(root, file).split("\\").join("/"), count);
  }
  return map;
}

function readCommitted() {
  const data = JSON.parse(readFileSync(baselinePath, "utf8"));
  return new Map(Object.entries(data.files ?? {}));
}

const write = process.argv.includes("--write");
const current = currentCounts();
const total = [...current.values()].reduce((sum, n) => sum + n, 0);

if (write) {
  const increases = baselineIncreases(readCommitted(), current);
  if (increases.length > 0) {
    process.stderr.write(
      "scale-class baseline may only shrink; --write refuses these increases (baseline file untouched):\n" +
        increases.join("\n") +
        "\nRemove the scale classes, then --write records the decrease.\n",
    );
    process.exit(1);
  }
  const files = Object.fromEntries([...current.entries()].sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(baselinePath, `${JSON.stringify({ version: 1, total, files }, null, 2)}\n`);
  process.stdout.write(`scale-class baseline: ${total} in ${current.size} files\n`);
  process.exit(0);
}

const committed = readCommitted();
const keys = new Set([...current.keys(), ...committed.keys()]);
const diffs = [];
for (const key of [...keys].sort()) {
  const now = current.get(key) ?? 0;
  const was = committed.get(key) ?? 0;
  if (now !== was) diffs.push(`${key}: baseline ${was}, current ${now}`);
}
const committedTotal = [...committed.values()].reduce((sum, n) => sum + n, 0);
if (diffs.length > 0 || committedTotal !== total) {
  process.stderr.write(
    `scale-class baseline is not the current count (baseline ${committedTotal}, current ${total}).\n` +
      `The count may only shrink. Remove scale classes; after a decrease, record it with: node scripts/check-scale-baseline.mjs --write\n` +
      diffs.slice(0, 30).join("\n") +
      (diffs.length > 30 ? `\n… ${diffs.length - 30} more\n` : "\n"),
  );
  process.exit(1);
}
process.stdout.write(`scale-class baseline: ${total} (not complete while this is above zero)\n`);
