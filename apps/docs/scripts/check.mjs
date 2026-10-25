// Docs coverage check (spike): fails CI when a catalog need has no doc
// page or a manifest reference goes stale. Runs the generator to a temp
// dir (never touching the build output) and asserts:
//   1. every catalog need maps to exactly one generated page;
//   2. every manifest key matches a catalog need heading exactly;
//   3. every manifest component/props exists in @zedtech/zedkit-ui exports;
//   4. every manifest demo exists in components/demos/registry.ts and its
//      demo file exports the demo;
//   5. pages stay thin: app/** imports no demo file directly (registry
//      only) and uses no namespace imports;
//   6. demos and frame use kit layout modules only (no raw <div>/<span>).
//
// Barrel parsing reuses scripts/catalog.mjs (import-safe).
// Usage: `node scripts/check.mjs`.
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// Shares parseBarrelExports with root scripts/catalog.mjs. A `#*`
// subpath cannot point outside the package (Node rejects it with
// ERR_INVALID_PACKAGE_TARGET), so the documented alternative is
// impossible here and the relative import stays.
// eslint-disable-next-line no-restricted-imports -- see above
import { parseBarrelExports } from "../../../scripts/catalog.mjs";
import { generate } from "./generate.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, "..");
const ROOT = join(APP, "..", "..");

const errors = [];
const catalogPath = join(ROOT, "docs", "catalog", "catalog.json");
if (!existsSync(catalogPath)) {
  console.error(`error: ${catalogPath} missing (run pnpm catalog:build at the root).`);
  process.exit(1);
}
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const manifest = JSON.parse(readFileSync(join(APP, "docs-manifest.json"), "utf8"));
const rich = manifest.rich ?? {};

const tmp = mkdtempSync(join(tmpdir(), "docs-check-"));
const { pages } = generate(tmp);
rmSync(tmp, { recursive: true, force: true });

const needs = [];
for (const [pkg, entry] of Object.entries(catalog.packages)) {
  for (const need of entry.needs) needs.push({ pkg, need: need.need });
}
if (pages !== needs.length) {
  errors.push(`generator emitted ${pages} pages for ${needs.length} catalog needs.`);
}

const headings = new Set(needs.map((n) => n.need));
for (const key of Object.keys(rich)) {
  if (!headings.has(key)) errors.push(`docs-manifest.json: "${key}" matches no catalog need heading.`);
}

function barrelExports(indexPath) {
  return new Set(parseBarrelExports(readFileSync(indexPath, "utf8"), indexPath, errors));
}

const uiExports = barrelExports(join(ROOT, "packages", "ui", "src", "index.ts"));
const registryText = readFileSync(join(APP, "components", "demos", "registry.ts"), "utf8");
const registryEntries = new Map();
for (const line of registryText.split("\n")) {
  const match = /^ {2}(\w+): \{ Demo: \w+, file: "([^"]+)" \},?$/.exec(line);
  if (match) registryEntries.set(match[1], match[2]);
}
for (const [key, spec] of Object.entries(rich)) {
  if (!uiExports.has(spec.component)) {
    errors.push(`docs-manifest.json: "${key}" references missing @zedtech/zedkit-ui export \`${spec.component}\`.`);
  }
  if (spec.props && !uiExports.has(spec.props)) {
    errors.push(`docs-manifest.json: "${key}" references missing @zedtech/zedkit-ui export \`${spec.props}\`.`);
  }
  if (!registryEntries.has(spec.demo)) {
    errors.push(`docs-manifest.json: "${key}" references missing registry demo \`${spec.demo}\`.`);
  } else {
    const demoPath = join(APP, "components", "demos", registryEntries.get(spec.demo));
    if (!existsSync(demoPath)) {
      errors.push(`registry: demo file \`${demoPath.slice(APP.length + 1)}\` missing for \`${spec.demo}\`.`);
    } else if (!readFileSync(demoPath, "utf8").includes(`export function ${spec.demo}`)) {
      errors.push(`registry: \`${demoPath.slice(APP.length + 1)}\` does not export \`${spec.demo}\`.`);
    }
  }
  if (spec.source && !existsSync(join(ROOT, "packages", "ui", "src", spec.source))) {
    errors.push(`docs-manifest.json: "${key}" references missing source file \`${spec.source}\`.`);
  }
}

function tsxFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...tsxFiles(path));
    else if (entry.name.endsWith(".tsx")) out.push(path);
  }
  return out;
}

for (const file of tsxFiles(join(APP, "app"))) {
  const rel = file.slice(APP.length + 1);
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (/from\s+["'].*components\/demos\//.test(line) && !line.includes("components/demos/registry")) {
      errors.push(`${rel}: import demos through components/demos/registry, never directly.`);
    }
    if (/^import\s+\*\s+as\s+/.test(line)) {
      errors.push(`${rel}: namespace imports are banned in pages; use named imports.`);
    }
  }
}

for (const file of tsxFiles(join(APP, "components"))) {
  const rel = file.slice(APP.length + 1);
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (/<(div|span)[\s>/]/.test(line)) {
      errors.push(`${rel}: raw <${/<(div|span)[\s>/]/.exec(line)[1]}> is banned; use kit Stack/Text/Section/Heading.`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`docs: ok (${pages} pages cover ${needs.length} needs, ${Object.keys(rich).length} rich).`);
}
