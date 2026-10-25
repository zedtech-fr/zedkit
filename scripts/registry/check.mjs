#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = join(root, "apps/docs/public/r");

const errors = [];

for (const name of ["badge", "drawer", "registry"]) {
  const path = join(outDir, `${name}.json`);
  if (!existsSync(path)) {
    errors.push(`missing ${path} (run pnpm registry:build)`);
    continue;
  }
  const raw = readFileSync(path, "utf8");
  if (name !== "registry" && raw.includes('from "./utils.js"')) {
    errors.push(`${name}.json still contains relative ./utils.js imports`);
  }
}

const validate = spawnSync(
  "pnpm",
  ["exec", "shadcn", "registry", "validate", "registry.json"],
  { cwd: root, encoding: "utf8" },
);
if (validate.status !== 0) {
  errors.push(
    `shadcn registry validate failed: ${validate.stderr || validate.stdout || `exit ${validate.status}`}`,
  );
}

if (errors.length) {
  for (const msg of errors) {
    console.error(msg);
  }
  process.exit(1);
}

console.log("registry: ok (badge, drawer, validate)");
