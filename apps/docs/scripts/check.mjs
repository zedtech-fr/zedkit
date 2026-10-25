// Docs coverage check: fails CI when a catalog need has no doc
// page or a manifest reference goes stale. Runs the generator to a temp
// dir (never touching the build output) and asserts:
//   1. every catalog need maps to exactly one generated page;
//   2. every manifest key matches a catalog need heading exactly;
//   3. every manifest component/props exists in @zedtech/zedkit-ui exports;
//   4. every manifest demo exists in components/demos/registry.ts and its
//      demo file exports the demo;
//   5. pages and views stay thin: app/** and ui/** import no demo file
//      directly (registry only) and use no namespace imports;
//   6. demos and frame use kit layout modules only (no raw <div>/<span>);
//   7. every page carries install tabs + a titled TSX example +
//      the At-a-glance guidance block (Who/What/Use when/Avoid when);
//   8. the home gallery covers every UI need exactly once, with the
//      manifest demo (or null);
//   9. the gallery stats match the catalog counts;
//  10. home scenarios resolve to catalog needs and current doc slugs;
//  11. prose files match live pages, avoid generated section titles,
//      and their first section appears in the merged output.
//
// Barrel parsing reuses scripts/catalog.mjs (import-safe).
// Usage: `node scripts/check.mjs`.
import { spawnSync } from "node:child_process";
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
// eslint-disable-next-line no-restricted-imports -- repo-root registry.json
import { loadRegistryBrickNames } from "../../../scripts/registry/catalog.mjs";
import {
  catalogPageKeys,
  expandGuideSnippets,
  GENERATED_DOC_SECTIONS,
  GUIDE_NAV_SLUGS,
  generate,
} from "./generate.mjs";

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
const registryBricks = new Set(loadRegistryBrickNames(ROOT));

const tmp = mkdtempSync(join(tmpdir(), "docs-check-"));
const { pages, prosePages, guidePages, gallery, stats, uiPackage, homeScenarios } = generate(tmp);
const livePageKeys = catalogPageKeys(catalog);

function mdxFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...mdxFiles(path));
    else if (entry.name.endsWith(".mdx") && entry.name !== "index.mdx") out.push(path);
  }
  return out;
}

// Every need page carries install tabs (memorized package-manager
// choice) and a titled TSX example — never bare pill blocks.
for (const file of mdxFiles(tmp)) {
  const rel = file.slice(tmp.length + 1);
  if (!rel.includes("/")) continue;
  const text = readFileSync(file, "utf8");
  if (text.includes("<ComponentPage")) continue;
  if (!text.includes('<Tabs groupId="package-manager"')) {
    errors.push(`generator: ${file.slice(tmp.length + 1)} lacks install tabs.`);
  }
  if (!text.includes('```tsx title="Usage"')) {
    errors.push(`generator: ${file.slice(tmp.length + 1)} lacks a titled TSX example.`);
  }
  if (!text.includes("## At a glance")) {
    errors.push(`generator: ${file.slice(tmp.length + 1)} lacks the At-a-glance guidance block.`);
  }
  for (const label of ["- **Who:**", "- **What:**", "- **Use when:**", "- **Avoid when:**"]) {
    if (!text.includes(label)) {
      errors.push(`generator: ${file.slice(tmp.length + 1)} lacks guidance bullet "${label}".`);
    }
  }
}

function proseSectionTitles(text) {
  const titles = [];
  for (const line of text.split("\n")) {
    const match = /^## (.+)$/.exec(line);
    if (match) titles.push(match[1]);
  }
  return titles;
}

function proseMdxFiles() {
  const root = join(APP, "prose");
  if (!existsSync(root)) return [];
  const out = [];
  for (const folderEntry of readdirSync(root, { withFileTypes: true })) {
    if (!folderEntry.isDirectory() || folderEntry.name === "guides") continue;
    const folderDir = join(root, folderEntry.name);
    for (const fileEntry of readdirSync(folderDir, { withFileTypes: true })) {
      if (fileEntry.isFile() && fileEntry.name.endsWith(".mdx")) {
        out.push({
          rel: `${folderEntry.name}/${fileEntry.name}`,
          key: `${folderEntry.name}/${fileEntry.name.replace(/\.mdx$/, "")}`,
          path: join(folderDir, fileEntry.name),
        });
      }
    }
  }
  return out;
}

for (const prose of proseMdxFiles()) {
  if (!livePageKeys.has(prose.key)) {
    errors.push(`prose: ${prose.rel} has no catalog page at /docs/${prose.key}.`);
    continue;
  }
  const source = readFileSync(prose.path, "utf8");
  const titles = proseSectionTitles(source);
  if (titles.length === 0) {
    errors.push(`prose: ${prose.rel} must define at least one "## " section.`);
    continue;
  }
  for (const title of titles) {
    if (GENERATED_DOC_SECTIONS.has(title)) {
      errors.push(`prose: ${prose.rel} redefines generated section "## ${title}".`);
    }
  }
  const mergedPath = join(tmp, `${prose.key}.mdx`);
  if (!existsSync(mergedPath)) {
    errors.push(`prose: merged page missing for ${prose.key} (generator bug).`);
    continue;
  }
  const merged = readFileSync(mergedPath, "utf8");
  if (!merged.includes(`## ${titles[0]}`)) {
    errors.push(`prose: ${prose.rel} first section "## ${titles[0]}" missing from merged page.`);
  }
}

const guidesDir = join(APP, "prose", "guides");
const snippetsDir = join(guidesDir, "snippets");
const guideRequiredSections = {
  "getting-started.mdx": [
    "Who this is for",
    "When to use zedkit",
    "Choose a package",
    "Prerequisites",
    "Quickstart",
    "Scenario",
    "Troubleshooting",
    "Next steps",
  ],
  "index.mdx": ["Start here", "Four areas", "Catalog reference"],
  "add-seo-to-nextjs.mdx": [
    "Who this is for",
    "Prerequisites",
    "Wire the site",
    "Verify",
    "Troubleshooting",
    "Next steps",
  ],
};
for (const [file, sections] of Object.entries(guideRequiredSections)) {
  const sourcePath = join(guidesDir, file);
  if (!existsSync(sourcePath)) {
    errors.push(`guides: missing ${file}.`);
    continue;
  }
  const expanded = expandGuideSnippets(readFileSync(sourcePath, "utf8"));
  for (const section of sections) {
    if (!expanded.includes(`## ${section}`)) {
      errors.push(`guides: ${file} must include "## ${section}".`);
    }
  }
}
if (existsSync(snippetsDir)) {
  const snippetRefs = new Set();
  for (const entry of readdirSync(guidesDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".mdx")) continue;
    const raw = readFileSync(join(guidesDir, entry.name), "utf8");
    for (const match of raw.matchAll(/\{\{snippet:([a-zA-Z0-9._-]+)\}\}/g)) snippetRefs.add(match[1]);
  }
  for (const entry of readdirSync(snippetsDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (!snippetRefs.has(entry.name)) {
      errors.push(`guides/snippets/${entry.name} is not referenced from guide MDX (use {{snippet:${entry.name}}}).`);
    }
  }
  for (const id of snippetRefs) {
    if (!existsSync(join(snippetsDir, id))) errors.push(`guides: snippet "${id}" has no file under prose/guides/snippets/.`);
  }
}
if (guidePages < 2) errors.push(`guides: expected at least getting-started.mdx and index.mdx (got ${guidePages}).`);
for (const slug of GUIDE_NAV_SLUGS) {
  if (!existsSync(join(tmp, `${slug}.mdx`))) errors.push(`guides: generated /docs/${slug} missing.`);
}

rmSync(tmp, { recursive: true, force: true });

const needs = [];
for (const [pkg, entry] of Object.entries(catalog.packages)) {
  for (const need of entry.needs) needs.push({ pkg, need: need.need });
}
if (pages !== needs.length) {
  errors.push(`generator emitted ${pages} pages for ${needs.length} catalog needs.`);
}

// generate() throws when no "ui" package exists, so uiPackage is set here.
const uiNeeds = catalog.packages[uiPackage].needs;
if (gallery.length !== uiNeeds.length) {
  errors.push(`gallery holds ${gallery.length} cards for ${uiNeeds.length} UI needs.`);
}
const byNeed = new Map(gallery.map((card) => [card.need, card]));
for (const need of uiNeeds) {
  const card = byNeed.get(need.need);
  if (!card) {
    errors.push(`gallery: missing card for "${need.need}".`);
    continue;
  }
  const wantDemo = rich[need.need]?.demo ?? null;
  if (card.demo !== wantDemo) {
    errors.push(`gallery: "${need.need}" demo is ${JSON.stringify(card.demo)}, manifest says ${JSON.stringify(wantDemo)}.`);
  }
}
const totalNeeds = Object.values(catalog.packages).reduce((n, entry) => n + entry.needs.length, 0);
if (stats.packages !== Object.keys(catalog.packages).length || stats.needs !== totalNeeds) {
  errors.push(`gallery: stale stats ${JSON.stringify(stats)}.`);
}
const uiPkgJson = JSON.parse(
  readFileSync(join(ROOT, "packages", "ui", "package.json"), "utf8"),
);
const galleryFile = existsSync(join(APP, "content", "gallery.ts"))
  ? readFileSync(join(APP, "content", "gallery.ts"), "utf8")
  : "";
if (galleryFile && !galleryFile.includes(`featuredPackageVersion: string = ${JSON.stringify(uiPkgJson.version)}`)) {
  errors.push("content/gallery.ts: featuredPackageVersion does not match packages/ui/package.json.");
}

const scenariosPath = join(APP, "content", "home-scenarios.ts");
if (!existsSync(scenariosPath)) {
  errors.push("content/home-scenarios.ts missing (run pnpm docs:generate).");
} else {
  const onDisk = readFileSync(scenariosPath, "utf8");
  const expected = JSON.stringify(homeScenarios, null, 2);
  if (!onDisk.includes(expected)) {
    errors.push("content/home-scenarios.ts is stale (run pnpm docs:generate).");
  }
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
  const match = /^ {2}(\w+): \{ Demo: \w+, file: "([^"]+)"(?:, center: true)? \},?$/.exec(line);
  if (match) registryEntries.set(match[1], match[2]);
}
for (const needEntry of Object.values(catalog.packages).flatMap((p) => p.needs)) {
  const spec = rich[needEntry.need];
  if (needEntry.registry && !registryBricks.has(needEntry.registry)) {
    errors.push(
      `catalog: "${needEntry.need}" Registry "${needEntry.registry}" is missing from registry.json.`,
    );
  }
  if (!spec?.registry) continue;
  if (needEntry.registry !== spec.registry) {
    errors.push(
      `docs-manifest.json: "${needEntry.need}" registry "${spec.registry}" does not match catalog Registry "${needEntry.registry ?? "(missing)"}".`,
    );
  }
  const examples = needEntry.examples ?? [];
  if (examples.length < 2) {
    errors.push(`catalog: "${needEntry.need}" component page needs at least 2 examples (has ${examples.length}).`);
  }
  if (!needEntry.a11y) errors.push(`catalog: "${needEntry.need}" component page is missing A11y.`);
  if (!needEntry.troubleshooting) {
    errors.push(`catalog: "${needEntry.need}" component page is missing Troubleshooting.`);
  }
  if (!spec.props || !spec.source) {
    errors.push(`docs-manifest.json: "${needEntry.need}" registry page needs props + source for AutoTypeTable.`);
  }
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

for (const dir of ["app", "ui"]) {
  if (!existsSync(join(APP, dir))) continue;
  for (const file of tsxFiles(join(APP, dir))) {
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
}

for (const file of tsxFiles(join(APP, "components"))) {
  const rel = file.slice(APP.length + 1);
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (/<(div|span)[\s>/]/.test(line)) {
      errors.push(`${rel}: raw <${/<(div|span)[\s>/]/.exec(line)[1]}> is banned; use kit Stack/Text/Section/Heading.`);
    }
  }
}

const nextConfig = readFileSync(join(APP, "next.config.mjs"), "utf8");
if (nextConfig.includes('output: "export"')) {
  const staticExportRoutes = [
    "app/robots.ts",
    "app/sitemap.ts",
    "app/opengraph-image.tsx",
    "app/api/search/route.ts",
  ];
  const forceStatic = /export const dynamic = "force-static"/;
  for (const rel of staticExportRoutes) {
    const file = join(APP, rel);
    const text = readFileSync(file, "utf8");
    if (!forceStatic.test(text)) {
      errors.push(
        `${rel}: missing export const dynamic = "force-static" (required with output: "export").`,
      );
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  const seoBuild = spawnSync("pnpm", ["--filter", "@zedtech/zedkit-seo", "build"], {
    cwd: ROOT,
    stdio: "pipe",
  });
  if (seoBuild.status !== 0) {
    console.error("docs:check: @zedtech/zedkit-seo build failed.");
    process.exitCode = 1;
  } else {
    const tutorial = spawnSync("node", [join(HERE, "verify-seo-tutorial.mjs")], {
      cwd: APP,
      stdio: "inherit",
    });
    if (tutorial.status !== 0) process.exitCode = 1;
  }
}

if (process.exitCode !== 1) {
  console.log(
    `docs: ok (${pages} pages cover ${needs.length} needs, ${guidePages} guides, ${prosePages} with prose, ${Object.keys(rich).length} rich, gallery ${gallery.length}).`,
  );
}
