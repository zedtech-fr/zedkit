// Catalog generator + checker.
//
// - `node scripts/catalog.mjs build [--root DIR]` regenerates
//   docs/catalog/catalog.json from packages/*/CATALOG.md and syncs the
//   discoverability fields (description, keywords, homepage, bugs,
//   repository.directory) from each CATALOG.md into its package.json.
// - `node scripts/catalog.mjs check [--root DIR]` verifies that every
//   public export of each package appears in that package's CATALOG.md,
//   that catalog.json is up to date, and that every public package.json
//   matches its CATALOG.md metadata (CI runs this).
//
// CATALOG.md header format (before the first `## <need>`; single source
// for the npm discoverability fields of public packages):
//
//   # Catalog — @zedtech/zedkit-core
//
//   - Keywords: typescript, utilities, result-type, ...
//   - Audience: Who the package is for, in plain words.
//   - Purpose: What it does, in plain words (becomes the npm description).
//   - Attribution: Original work by the same author. (optional, appended
//     to the description; keep the origin note here, never a project path)
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
//   - Derived from: `shadcn/ui` (+ optional item, e.g. `shadcn/ui
//     (dialog)`); omit for kit-authored entries (absence means kit)
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
    const derivedFrom = field("Derived from");
    if (derivedFrom !== null && !derivedFrom.startsWith("shadcn/ui")) {
      errors.push(
        `${catalogPath}: need "${need}" has Derived from "${derivedFrom}" (want "shadcn/ui" + optional item; omit the line for kit-authored entries).`,
      );
    }
    const entry = {
      need,
      import: field("Import"),
      wraps: field("Wraps"),
      status: field("Status"),
      derivedFrom,
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

// Discoverability metadata from the CATALOG.md header (before `## `).
function parsePackageMeta(catalogText) {
  const header = catalogText.split(/^## /m)[0];
  const field = (name) => {
    const match = header.match(new RegExp(`^- ${name}:\\s*(.+)$`, "m"));
    return match ? match[1].trim() : null;
  };
  const keywords = field("Keywords");
  return {
    keywords: keywords ? keywords.split(",").map((k) => k.trim()).filter(Boolean) : null,
    audience: field("Audience"),
    purpose: field("Purpose"),
    attribution: field("Attribution"),
  };
}

const REPO_URL = "https://github.com/zedtech-fr/zedkit";

// Expected npm discoverability fields, derived from the catalog header.
function expectedManifestFields(pkg) {
  const directory = `packages/${basename(pkg.dir)}`;
  const description = pkg.meta.attribution
    ? `${pkg.meta.purpose} ${pkg.meta.attribution}`
    : pkg.meta.purpose;
  return {
    description,
    keywords: pkg.meta.keywords,
    homepage: `${REPO_URL}/tree/main/${directory}`,
    bugs: { url: `${REPO_URL}/issues` },
    repositoryDirectory: directory,
  };
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
      manifest,
      manifestPath,
      isPrivate: manifest.private === true,
      catalogPath,
      catalogText,
      meta: catalogText ? parsePackageMeta(catalogText) : null,
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
      keywords: pkg.meta?.keywords ?? [],
      audience: pkg.meta?.audience ?? null,
      needs: pkg.needs,
    };
  }
  return `${JSON.stringify(out, null, 2)}\n`;
}

function checkManifestFields(pkg, errors) {
  if (pkg.isPrivate || !pkg.meta) return;
  for (const key of ["keywords", "audience", "purpose"]) {
    if (!pkg.meta[key] || pkg.meta[key].length === 0) {
      errors.push(`${pkg.catalogPath}: package header is missing "${key}" (single source for the npm discoverability fields).`);
      return;
    }
  }
  const expected = expectedManifestFields(pkg);
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const mismatch = (field, actual) =>
    `${pkg.manifestPath}: ${field} does not match ${pkg.catalogPath}. Run \`pnpm catalog:build\` and commit the result. (actual: ${JSON.stringify(actual)})`;
  if (!same(pkg.manifest.description, expected.description)) errors.push(mismatch("description", pkg.manifest.description));
  if (!same(pkg.manifest.keywords, expected.keywords)) errors.push(mismatch("keywords", pkg.manifest.keywords));
  if (!same(pkg.manifest.homepage, expected.homepage)) errors.push(mismatch("homepage", pkg.manifest.homepage));
  if (!same(pkg.manifest.bugs, expected.bugs)) errors.push(mismatch("bugs", pkg.manifest.bugs));
  if (!same(pkg.manifest.repository?.directory, expected.repositoryDirectory)) {
    errors.push(mismatch("repository.directory", pkg.manifest.repository?.directory));
  }
}

// Write the discoverability fields into package.json, keeping every other
// key (and their relative order) untouched. New keys land in the
// conventional slot: after publishConfig/description, before license.
function syncManifestFields(pkg) {
  if (pkg.isPrivate || !pkg.meta?.keywords || !pkg.meta.audience || !pkg.meta.purpose) return false;
  const expected = expectedManifestFields(pkg);
  const ordered = {};
  let inserted = false;
  for (const [key, value] of Object.entries(pkg.manifest)) {
    if (key === "description" || key === "keywords" || key === "homepage" || key === "bugs") continue;
    if (!inserted && key !== "name" && key !== "version" && key !== "publishConfig") {
      ordered.description = expected.description;
      ordered.keywords = expected.keywords;
      ordered.homepage = expected.homepage;
      ordered.bugs = expected.bugs;
      inserted = true;
    }
    ordered[key] = value;
  }
  if (!inserted) {
    ordered.description = expected.description;
    ordered.keywords = expected.keywords;
    ordered.homepage = expected.homepage;
    ordered.bugs = expected.bugs;
  }
  const repo = ordered.repository;
  const repoObject = typeof repo === "string" ? { type: "git", url: repo } : (repo ?? {});
  ordered.repository = { ...repoObject, directory: expected.repositoryDirectory };
  const next = `${JSON.stringify(ordered, null, 2)}\n`;
  if (next === `${JSON.stringify(pkg.manifest, null, 2)}\n`) return false;
  // Preserve the original trailing-newline style (all manifests end with \n).
  writeFileSync(pkg.manifestPath, next);
  return true;
}

function check(packages, root, errors) {
  for (const pkg of packages) {
    if (pkg.hasCode && !pkg.catalogText) {
      errors.push(`${pkg.name}: has src/index.ts but no CATALOG.md.`);
      continue;
    }
    if (!pkg.catalogText) continue;
    checkManifestFields(pkg, errors);
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
      let synced = 0;
      for (const pkg of packages) {
        if (syncManifestFields(pkg)) synced++;
      }
      console.log(`catalog: wrote ${jsonPath} (${packages.length} packages, ${synced} manifests synced).`);
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
