// Ensures every /r/<brick>.json URL in the docs app references a brick from
// registry.json. Run from docs:check (no export required).
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
// eslint-disable-next-line no-restricted-imports -- repo-root registry.json loader (same as check.mjs)
import { loadRegistryBrickNames } from "../../../scripts/registry/catalog.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, "..");
const ROOT = join(APP, "..", "..");

export const REGISTRY_JSON_URL = /\/r\/([a-z][a-z0-9-]*)\.json/g;

export function unknownRegistryBricks(text, allowed) {
  const unknown = [];
  for (const match of text.matchAll(REGISTRY_JSON_URL)) {
    if (!allowed.has(match[1])) unknown.push(match[1]);
  }
  return unknown;
}

export function checkRegistryUrlFiles(files, allowed) {
  const published = [...allowed].join(", ");
  const errors = [];
  for (const { rel, text } of files) {
    for (const brick of unknownRegistryBricks(text, allowed)) {
      errors.push(`${rel}: /r/${brick}.json is not in registry.json (published: ${published}).`);
    }
  }
  return errors;
}

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "content" || entry.name === "node_modules" || entry.name === "out") continue;
      walk(path, acc);
    } else if (/\.(tsx?|mjs|json|mdx?)$/.test(entry.name) && !/\.test\./.test(entry.name)) {
      acc.push(path);
    }
  }
  return acc;
}

function main() {
  const allowed = new Set(loadRegistryBrickNames(ROOT));
  const files = walk(APP).map((file) => ({
    rel: file.slice(APP.length + 1),
    text: readFileSync(file, "utf8"),
  }));
  const errors = checkRegistryUrlFiles(files, allowed);
  if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
    return;
  }
  console.log(`docs-registry-urls: ok (${allowed.size} bricks).`);
}

const invoked = process.argv[1] ? resolve(process.argv[1]) : null;
if (invoked === fileURLToPath(import.meta.url)) main();
