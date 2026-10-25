// Ensures every /r/<brick>.json URL in the docs app references a brick from
// registry.json. Run from docs:check (no export required).
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// eslint-disable-next-line no-restricted-imports -- repo-root registry.json loader (same as check.mjs)
import { loadRegistryBrickNames } from "../../../scripts/registry/catalog.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, "..");
const ROOT = join(APP, "..", "..");

const allowed = new Set(loadRegistryBrickNames(ROOT));
const errors = [];
const urlRe = /\/r\/([a-z][a-z0-9-]*)\.json/g;

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "content" || entry.name === "node_modules" || entry.name === "out") continue;
      walk(path, acc);
    } else if (/\.(tsx?|mjs|json|mdx?)$/.test(entry.name)) {
      acc.push(path);
    }
  }
  return acc;
}

for (const file of walk(APP)) {
  const rel = file.slice(APP.length + 1);
  const text = readFileSync(file, "utf8");
  for (const match of text.matchAll(urlRe)) {
    const brick = match[1];
    if (!allowed.has(brick)) {
      errors.push(
        `${rel}: /r/${brick}.json is not in registry.json (published: ${[...allowed].join(", ")}).`,
      );
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`docs-registry-urls: ok (${allowed.size} bricks).`);
}
