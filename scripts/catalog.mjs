// Catalog generator + checker.
//
// - `node scripts/catalog.mjs build [--root DIR]` regenerates
//   docs/catalog/catalog.json from packages/*/CATALOG.md.
// - `node scripts/catalog.mjs check [--root DIR]` verifies that every
//   public export of each package appears in that package's CATALOG.md
//   and that catalog.json is up to date (CI runs this).
//
// CATALOG.md entry format (one `## <need>` section per need):
//
//   ## Do X without Y
//   - Import: `@zedkit/core` — `a`, `b`
//   - Wraps: `some-npm-package` (or `(none)`)
//   - Status: stable (or `planned`)
//   ```ts
//   ...5-line example...
//   ```
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = resolve(HERE, "..");

function parseArgs(argv) {
  const mode = argv[2] === "check" ? "check" : "build";
  const rootFlag = argv.indexOf("--root");
  const root = rootFlag === -1 ? DEFAULT_ROOT : resolve(argv[rootFlag + 1]);
  return { mode, root };
}

function packageDirs(root) {
  const dir = join(root, "packages");
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => join(root, "packages", e.name));
}

function readIfExists(path) {
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf8");
}

// Parse `## <need>` sections: Import / Wraps / Status fields + first ts example.
function parseCatalog(text, catalogPath, errors) {
  const needs = [];
  const sections = text.split(/^## /m).slice(1);
  for (const section of sections) {
    const [heading, ...rest] = section.split("\n");
    const body = rest.join("\n");
    const need = heading.trim();
    const field = (name) => {
      const match = body.match(new RegExp(`^- ${name}:\\s*(.+)$`, "m"));
      return match ? match[1].trim() : null;
    };
    const entry = {
      need,
      import: field("Import"),
      wraps: field("Wraps"),
      status: field("Status"),
      example: null,
    };
    const example = body.match(/```ts\n([\s\S]*?)```/);
    if (example) entry.example = example[1].trim();
    for (const key of ["import", "wraps", "status", "example"]) {
      if (!entry[key]) {
        errors.push(`${catalogPath}: need "${need}" is missing ${key}.`);
      }
    }
    if (entry.status && entry.status !== "stable" && entry.status !== "planned") {
      errors.push(`${catalogPath}: need "${need}" has status "${entry.status}" (want stable|planned).`);
    }
    needs.push(entry);
  }
  return needs;
}

// Exported symbol names from a barrel file with explicit named exports.
function parseBarrelExports(text, indexPath, errors) {
  if (/export\s*\*\s*from/.test(text)) {
    errors.push(`${indexPath}: \`export *\` is not allowed; list named exports explicitly so the catalog check can verify them.`);
  }
  const names = new Set();
  for (const match of text.matchAll(/export\s*\{([\s\S]*?)\}/g)) {
    for (let part of match[1].split(",")) {
      part = part.trim().replace(/^type\s+/, "");
      if (!part) continue;
      const alias = part.split(/\s+as\s+/);
      names.add(alias[alias.length - 1].trim());
    }
  }
  for (const match of text.matchAll(/export\s+(?:async\s+function|function|class|const|type|interface|enum)\s+(\w+)/g)) {
    names.add(match[1]);
  }
  return [...names];
}

function collectPackages(root, errors) {
  const collected = [];
  for (const dir of packageDirs(root)) {
    const manifestPath = join(dir, "package.json");
    const manifestText = readIfExists(manifestPath);
    if (!manifestText) continue;
    const manifest = JSON.parse(manifestText);
    const catalogPath = join(dir, "CATALOG.md");
    const catalogText = readIfExists(catalogPath);
    const indexText = readIfExists(join(dir, "src", "index.ts"));
    const subpaths = Object.keys(manifest.exports ?? { ".": "" }).map((key) =>
      key === "." ? manifest.name : `${manifest.name}${key.slice(1)}`,
    );
    collected.push({
      name: manifest.name,
      dir,
      catalogPath,
      catalogText,
      needs: catalogText ? parseCatalog(catalogText, catalogPath, errors) : [],
      symbols: indexText ? parseBarrelExports(indexText, join(dir, "src", "index.ts"), errors) : [],
      subpaths,
      hasCode: indexText !== null,
    });
  }
  return collected;
}

function renderCatalogJson(packages) {
  const out = {
    _generated: "Do not edit. Generated from packages/*/CATALOG.md by `pnpm catalog:build`.",
    packages: {},
  };
  for (const pkg of [...packages].sort((a, b) => a.name.localeCompare(b.name))) {
    out.packages[pkg.name] = {
      catalog: `packages/${pkg.dir.split("/").pop()}/CATALOG.md`,
      needs: pkg.needs,
    };
  }
  return `${JSON.stringify(out, null, 2)}\n`;
}

function check(packages, root, errors) {
  for (const pkg of packages) {
    if (pkg.hasCode && !pkg.catalogText) {
      errors.push(`${pkg.name}: has src/index.ts but no CATALOG.md.`);
      continue;
    }
    if (!pkg.catalogText) continue;
    for (const symbol of pkg.symbols) {
      if (!pkg.catalogText.includes(symbol)) {
        errors.push(`${pkg.catalogPath}: export \`${symbol}\` is not mentioned (every public export must appear in its package CATALOG.md).`);
      }
    }
    for (const subpath of pkg.subpaths) {
      if (!pkg.catalogText.includes(subpath)) {
        errors.push(`${pkg.catalogPath}: import path \`${subpath}\` is not mentioned.`);
      }
    }
  }
  const jsonPath = join(root, "docs", "catalog", "catalog.json");
  const current = readIfExists(jsonPath);
  const rendered = renderCatalogJson(packages);
  if (current !== rendered) {
    errors.push(`${jsonPath} is out of date. Run \`pnpm catalog:build\` and commit the result.`);
  }
  // The consumer snippet in README.md must match the use-zedkit core rule.
  const skill = readIfExists(join(root, ".agents", "skills", "use-zedkit", "SKILL.md"));
  const readme = readIfExists(join(root, "README.md"));
  if (skill && readme) {
    const quoted = skill.match(/(?:^> .+\n?)+/m);
    const fenced = readme.match(/```md\n([\s\S]*?)```/);
    const normalize = (s) => s.replace(/^> /gm, "").trim();
    if (!quoted || !fenced || normalize(quoted[0]) !== normalize(fenced[1])) {
      errors.push("README consumer snippet drifted from .agents/skills/use-zedkit/SKILL.md core rule; keep them in sync.");
    }
  }
}

const { mode, root } = parseArgs(process.argv);
const errors = [];
const packages = collectPackages(root, errors);
if (mode === "build") {
  if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else {
    const jsonPath = join(root, "docs", "catalog", "catalog.json");
    mkdirSync(dirname(jsonPath), { recursive: true });
    writeFileSync(jsonPath, renderCatalogJson(packages));
    console.log(`catalog: wrote ${jsonPath} (${packages.length} packages).`);
  }
}
if (mode === "check") {
  check(packages, root, errors);
  if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(`catalog: ok (${packages.length} packages).`);
  }
}
