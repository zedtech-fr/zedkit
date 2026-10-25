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
//   - Import: `@zedtech/zedkit-core` — `a`, `b`
//   - Wraps: `some-npm-package` (or `(none)`)
//   - Status: beta (planned|alpha|beta|stable|deprecated; new entries
//     start at alpha — see docs/catalog/README.md for the promotion
//     criteria)
//   - Replaced by: `other-symbol` (required when Status is deprecated)
//   ```ts
//   ...5-line example...
//   ```
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = resolve(HERE, "..");

function usage() {
  return "Usage: node scripts/catalog.mjs build|check [--root DIR]";
}

function parseArgs(argv) {
  const args = argv.slice(2);
  let mode = null;
  let root = DEFAULT_ROOT;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--root") {
      const value = args[i + 1];
      if (!value || value.startsWith("-")) {
        console.error(`${usage()}\nerror: --root needs a directory.`);
        process.exit(2);
      }
      root = resolve(value);
      i++;
    } else if ((args[i] === "build" || args[i] === "check") && !mode) {
      mode = args[i];
    } else {
      console.error(`${usage()}\nerror: unexpected argument "${args[i]}".`);
      process.exit(2);
    }
  }
  if (!mode) {
    console.error(`${usage()}\nerror: missing mode (build|check).`);
    process.exit(2);
  }
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
  // Normalize CRLF so Windows checkouts parse identically.
  return readFileSync(path, "utf8").replace(/\r\n/g, "\n");
}

// Parse `## <need>` sections: Import / Wraps / Status fields + first ts example.
const STATUSES = ["planned", "alpha", "beta", "stable", "deprecated"];

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
    if (entry.status && !STATUSES.includes(entry.status)) {
      errors.push(`${catalogPath}: need "${need}" has status "${entry.status}" (want ${STATUSES.join("|")}).`);
    }
    const replacedBy = field("Replaced by");
    if (entry.status === "deprecated") {
      if (!replacedBy) {
        errors.push(`${catalogPath}: need "${need}" is deprecated but names no replacement ("- Replaced by: ...").`);
      } else {
        entry.replacedBy = replacedBy;
      }
    }
    needs.push(entry);
  }
  return needs;
}

// Strip // comments, ignoring // inside strings (e.g. "https://...").
function stripLineComments(code) {
  return code
    .split("\n")
    .map((line) => {
      let quote = null;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (quote) {
          if (ch === "\\") i++;
          else if (ch === quote) quote = null;
        } else if (ch === '"' || ch === "'" || ch === "`") {
          quote = ch;
        } else if (ch === "/" && line[i + 1] === "/") {
          return line.slice(0, i);
        }
      }
      return line;
    })
    .join("\n");
}

// Exported symbol names from a barrel file with explicit named exports.
// Exported for reuse (apps/docs/scripts/check.mjs); the CLI runner below
// is import-guarded so importing this module has no side effects.
export function parseBarrelExports(text, indexPath, errors) {
  const code = stripLineComments(text.replace(/\/\*[\s\S]*?\*\//g, ""));
  if (/^\s*export\s*\*/m.test(code)) {
    errors.push(`${indexPath}: \`export *\` is not allowed; list named exports explicitly so the catalog check can verify them.`);
  }
  if (/^\s*export\s+default\b/m.test(code)) {
    errors.push(`${indexPath}: \`export default\` is not allowed in the barrel; use named exports so the catalog check can verify them.`);
  }
  const names = new Set();
  for (const match of code.matchAll(/^\s*export\s*(?:type\s*)?\{([\s\S]*?)\}/gm)) {
    for (let part of match[1].split(",")) {
      part = part.trim().replace(/^type\s+/, "");
      if (!part) continue;
      const alias = part.split(/\s+as\s+/);
      names.add(alias[alias.length - 1].trim());
    }
  }
  for (const match of code.matchAll(/^\s*export\s+(?:async\s+function|function|class|const|type|interface|enum)\s+(\w+)/gm)) {
    names.add(match[1]);
  }
  return [...names];
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Text where a symbol mention counts as catalog coverage: Import lines,
// fenced code blocks, and inline code spans. Prose mentions do not count.
function catalogSearchText(catalogText) {
  const chunks = [];
  for (const match of catalogText.matchAll(/^-\s*Import:\s*(.+)$/gm)) {
    chunks.push(match[1]);
  }
  for (const match of catalogText.matchAll(/```[\s\S]*?```/g)) {
    chunks.push(match[0]);
  }
  for (const match of catalogText.matchAll(/`([^`]+)`/g)) {
    chunks.push(match[1]);
  }
  return chunks.join("\n");
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
    const subpaths = Object.keys(manifest.exports ?? { ".": "" })
      // Non-code entries need no catalog line.
      .filter((key) => key !== "./package.json")
      .map((key) => (key === "." ? manifest.name : `${manifest.name}${key.slice(1)}`));
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
      catalog: `packages/${basename(pkg.dir)}/CATALOG.md`,
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
    const searchText = catalogSearchText(pkg.catalogText);
    for (const symbol of pkg.symbols) {
      if (!new RegExp(`\\b${escapeRegExp(symbol)}\\b`).test(searchText)) {
        errors.push(`${pkg.catalogPath}: export \`${symbol}\` is not mentioned in an Import line, example, or code span (every public export must appear in its package CATALOG.md).`);
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
    const fenced = readme.match(/<!-- use-zedkit-snippet:[^>]*-->\s*```md\n([\s\S]*?)```/);
    const normalize = (s) => s.replace(/^> /gm, "").trim();
    if (!quoted || !fenced || normalize(quoted[0]) !== normalize(fenced[1])) {
      errors.push("README consumer snippet drifted from .agents/skills/use-zedkit/SKILL.md core rule; keep them in sync.");
    }
  }
}

const invoked = process.argv[1] ? resolve(process.argv[1]) : null;
if (invoked === fileURLToPath(import.meta.url)) {
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
}
