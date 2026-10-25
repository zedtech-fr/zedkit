#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = join(root, "apps/docs/public/r");

const errors = [];

for (const name of ["badge", "drawer", "registry"]) {
  const path = join(outDir, `${name}.json`);
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    errors.push(`missing ${path} (run pnpm registry:build)`);
    continue;
  }
  if (name !== "registry" && raw.includes('from "./utils.js"')) {
    errors.push(`${name}.json still contains relative ./utils.js imports`);
  }
}

try {
  execFileSync("pnpm", ["exec", "shadcn", "registry", "validate", "registry.json"], {
    cwd: root,
    stdio: "pipe",
  });
} catch (e) {
  errors.push(`shadcn registry validate failed: ${e.stderr?.toString() ?? e.message}`);
}

if (errors.length) {
  for (const msg of errors) {
    console.error(msg);
  }
  process.exit(1);
}

console.log("registry: ok (badge, drawer, validate)");
