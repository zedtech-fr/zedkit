import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

// Agent instructions that name a file the repo no longer has send coding agents to dead code (audit v6: a removed
// suggest client was still prescribed, with its old fallback). Every `lib/…`, `apps/docs/lib/…`, `features/identity/…`,
// or `apps/docs/features/identity/…` path they cite must exist.
// Backtick PascalCase names (UnavailableBanner after the dock trim) must still have a function/const in apps/docs or packages/ui.
const docs = join(dirname(fileURLToPath(import.meta.url)), "..");
const root = join(docs, "..", "..");
const sources = [join(docs, "AGENTS.md"), join(root, "deploy", "AGENTS.md")];
const SKIP_DIRS = new Set(["node_modules", ".next", "out", "dist", "test-results", "playwright-report", "coverage"]);

function walkSourceFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walkSourceFiles(path, out);
    else if (/\.(?:ts|tsx|mjs)$/.test(entry.name)) out.push(path);
  }
  return out;
}

test("agent instructions only cite docs lib and identity feature files that exist", () => {
  for (const source of sources) {
    const text = readFileSync(source, "utf8");
    const cited = [
      ...text.matchAll(/`((?:apps\/docs\/)?(?:lib|features\/identity)\/[\w./-]+\.(?:ts|tsx|mjs))`/g),
    ].map((m) => m[1]);
    for (const path of cited) {
      const file = path.startsWith("apps/") ? join(root, path) : join(docs, path);
      assert.ok(existsSync(file), `${source} cites ${path}, which does not exist`);
    }
  }
});

test("agent instructions only cite PascalCase UI names that still exist", () => {
  const cited = new Set();
  for (const source of sources) {
    const text = readFileSync(source, "utf8");
    for (const match of text.matchAll(/`([A-Z][a-z][A-Za-z0-9]+)`/g)) cited.add(match[1]);
  }
  const remaining = new Set(cited);
  const files = [...walkSourceFiles(docs), ...walkSourceFiles(join(root, "packages/ui/src"))];
  for (const file of files) {
    if (remaining.size === 0) break;
    const text = readFileSync(file, "utf8");
    for (const name of remaining) {
      if (new RegExp(`(?:function|const) ${name}\\b`).test(text)) remaining.delete(name);
    }
  }
  assert.deepEqual([...remaining], [], "agent instructions cite PascalCase names with no function/const in apps/docs or packages/ui");
});
