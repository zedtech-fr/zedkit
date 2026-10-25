// Docs content generator (spike): catalog.json -> Fumadocs MDX pages.
//
// - `node scripts/generate.mjs [outDir]` regenerates every catalog need
//   as an MDX page (badge, At-a-glance guidance block from the catalog
//   guidance fields, install tabs with the changesets version,
//   catalog example, wraps line) plus per-folder meta.json nav files.
// - Needs listed in docs-manifest.json also get a live preview (the
//   REAL workspace component via components/component-preview.tsx, which
//   resolves the demo through components/demos/registry.ts) and a props
//   table resolved at build by fumadocs-typescript AutoTypeTable
//   (via components/props-table.tsx, inherited props expanded).
// - Also writes public/llms.txt (same source, always current).
//
// Catalog fields drive the fixed sections; optional prose under
// `prose/<folder>/<slug>.mdx` is merged after Example (see PAGE-TEMPLATE.md).
// The docs check (scripts/check.mjs) runs this to a temp dir and asserts
// full coverage plus prose rules.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
// eslint-disable-next-line no-restricted-imports -- repo-root registry.json
import { loadRegistryBrickNames } from "../../../scripts/registry/catalog.mjs";
import { SEO_DESCRIPTION_MAX, truncateDescription } from "@zedtech/zedkit-seo";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, "..");
const ROOT = join(APP, "..", "..");
const PROSE_DIR = join(APP, "prose");
const GUIDES_DIR = join(PROSE_DIR, "guides");
const GUIDE_SNIPPETS_DIR = join(GUIDES_DIR, "snippets");

/** Standalone guide pages (not catalog needs), first in docs nav when listed here. */
export const GUIDE_NAV_SLUGS = ["getting-started", "add-seo-to-nextjs"];

/** Section titles owned by the generator — prose must not repeat them. */
export const GENERATED_DOC_SECTIONS = new Set(["At a glance", "Preview", "Install", "Example", "Props"]);

function slugify(need) {
  const slug = need
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length > 0 ? slug : "need";
}

function shortName(pkg) {
  return pkg.startsWith("@zedtech/zedkit-") ? pkg.slice("@zedtech/zedkit-".length) : pkg.replace(/^@/, "").replace("/", "-");
}

function packageVersion(pkgDir) {
  const text = readFileSync(join(ROOT, "packages", pkgDir, "package.json"), "utf8");
  return JSON.parse(text).version ?? "0.0.0";
}

function metaDescription(need) {
  const purpose = (need.purpose ?? "").trim();
  if (purpose.length === 0) {
    throw new Error(`generator: catalog need "${need.need}" is missing purpose.`);
  }
  return truncateDescription(purpose);
}

// "At a glance" block, generated from the catalog guidance fields
// (Audience/Purpose/When to use/When not to use/See also) so every
// page answers who/what/when with zero hand-written prose.
function guidanceBlock(need, seeAlsoLinks) {
  const lines = [
    "## At a glance",
    "",
    `- **Who:** ${need.audience}`,
    `- **What:** ${need.purpose}`,
    `- **Use when:** ${need.whenToUse}`,
    `- **Avoid when:** ${need.whenNotToUse}`,
  ];
  if (seeAlsoLinks.length > 0) lines.push(`- **See also:** ${seeAlsoLinks.join(", ")}`);
  lines.push("");
  return lines;
}

function componentPageMdx(pkg, need, version, spec, related, prose) {
  const examples = need.examples ?? [{ title: "Simple", code: need.example }];
  const head = [
    "---",
    `title: ${JSON.stringify(need.need)}`,
    `description: ${JSON.stringify(metaDescription(need))}`,
    `status: ${need.status}`,
    "---",
    "",
    "{/* GENERATED from docs/catalog/catalog.json — do not edit. */}",
    "",
    `import { Badge } from "@zedtech/zedkit-ui";`,
    `import { ComponentPage } from "../../../components/component-page";`,
    "",
    `<Badge>${need.status}</Badge>`,
    "",
    "<ComponentPage",
    `  packageName={${JSON.stringify(pkg)}}`,
    `  version={${JSON.stringify(version)}}`,
    `  importLine={${JSON.stringify(need.import)}}`,
    `  wraps={${JSON.stringify(need.wraps)}}`,
    `  registry={${JSON.stringify(spec.registry)}}`,
    `  demo={${JSON.stringify(spec.demo)}}`,
    `  propsFile={${JSON.stringify(spec.propsFile)}}`,
    `  propsName={${JSON.stringify(spec.propsName)}}`,
    `  examples={${JSON.stringify(examples)}}`,
    `  a11y={${JSON.stringify(need.a11y ?? "")}}`,
    `  troubleshooting={${JSON.stringify(need.troubleshooting ?? "")}}`,
    `  related={${JSON.stringify(related)}}`,
    "/>",
    "",
  ];
  if (prose) head.push(prose);
  return head.join("\n");
}

/** Valid `folder/slug` keys for every catalog need page. */
export function catalogPageKeys(catalog) {
  const keys = new Set();
  for (const [pkg, entry] of Object.entries(catalog.packages)) {
    const folder = shortName(pkg);
    const seen = new Set();
    for (const need of entry.needs) {
      let slug = slugify(need.need);
      for (let i = 2; seen.has(slug); i++) slug = `${slugify(need.need)}-${i}`;
      seen.add(slug);
      keys.add(`${folder}/${slug}`);
    }
  }
  return keys;
}

function readProse(folder, slug) {
  const path = join(PROSE_DIR, folder, `${slug}.mdx`);
  if (!existsSync(path)) return null;
  const text = readFileSync(path, "utf8").trim();
  if (text.length === 0) return null;
  return `${text}\n`;
}

export function expandGuideSnippets(text) {
  return text.replace(/\{\{snippet:([a-zA-Z0-9._-]+)\}\}/g, (_, id) => {
    const path = join(GUIDE_SNIPPETS_DIR, id);
    if (!existsSync(path)) throw new Error(`guide snippet missing: ${id}`);
    return readFileSync(path, "utf8").trimEnd();
  });
}

function writeGuidePages(outDir) {
  if (!existsSync(GUIDES_DIR)) return 0;
  let count = 0;
  for (const entry of readdirSync(GUIDES_DIR, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".mdx")) continue;
    const body = expandGuideSnippets(readFileSync(join(GUIDES_DIR, entry.name), "utf8"));
    writeFileSync(join(outDir, entry.name), body.endsWith("\n") ? body : `${body}\n`);
    count += 1;
  }
  return count;
}

function pageMdx(pkg, need, version, rich, seeAlsoLinks, prose) {
  const head = [
    "---",
    `title: ${JSON.stringify(need.need)}`,
    `description: ${JSON.stringify(metaDescription(need))}`,
    `status: ${need.status}`,
    "---",
    "",
    "{/* GENERATED from docs/catalog/catalog.json — do not edit. */}",
    "",
    `import { Badge } from "@zedtech/zedkit-ui";`,
    `import { Tab, Tabs } from "fumadocs-ui/components/tabs";`,
  ];
  if (rich) head.push(`import { ComponentPreview } from "../../../components/component-preview";`);
  if (rich && rich.propsFile && rich.propsName) {
    head.push(`import { PropsTable } from "../../../components/props-table";`);
  }
  head.push("", `<Badge>${need.status}</Badge>`, "");
  head.push(...guidanceBlock(need, seeAlsoLinks));
  if (rich) {
    const detail = need.import.replace(/`/g, "");
    const hasProps = Boolean(rich.propsFile && rich.propsName);
    head.push(
      "## Preview",
      "",
      `<ComponentPreview demo="${rich.demo}" detail={${JSON.stringify(detail)}} hasProps={${JSON.stringify(hasProps)}} />`,
      "",
    );
  }
  head.push(
    "## Install",
    "",
    `<Tabs groupId="package-manager" persist items={["pnpm", "npm", "yarn"]}>`,
    `  <Tab value="pnpm">`,
    "",
    "```sh",
    `pnpm add ${pkg}`,
    "```",
    "",
    "  </Tab>",
    `  <Tab value="npm">`,
    "",
    "```sh",
    `npm install ${pkg}`,
    "```",
    "",
    "  </Tab>",
    `  <Tab value="yarn">`,
    "",
    "```sh",
    `yarn add ${pkg}`,
    "```",
    "",
    "  </Tab>",
    "</Tabs>",
    "",
    `Latest: \`${version}\` (via changesets).`,
    "",
    "## Example",
    "",
    "```tsx title=\"Usage\"",
    need.example,
    "```",
    "",
    `Wraps: ${need.wraps}`,
    "",
  );
  if (prose) head.push(prose);
  if (rich && rich.propsFile && rich.propsName) {
    head.push("## Props", "", `<PropsTable file="${rich.propsFile}" name="${rich.propsName}" />`, "");
  }
  return head.join("\n");
}

export function generate(outDir) {
  const catalog = JSON.parse(readFileSync(join(ROOT, "docs", "catalog", "catalog.json"), "utf8"));
  const manifest = JSON.parse(readFileSync(join(APP, "docs-manifest.json"), "utf8"));
  const rich = manifest.rich ?? {};
  const sorted = Object.entries(catalog.packages).sort(([a], [b]) => a.localeCompare(b));

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  // First pass: folder + slug per need heading, so "See also" targets
  // (plain need headings, unique across the catalog per catalog:check)
  // resolve to links before any page is written.
  const placementByNeed = new Map();
  for (const [pkg, entry] of sorted) {
    const folder = shortName(pkg);
    const seen = new Set();
    for (const need of entry.needs) {
      let slug = slugify(need.need);
      for (let i = 2; seen.has(slug); i++) slug = `${slugify(need.need)}-${i}`;
      seen.add(slug);
      placementByNeed.set(need.need, { folder, slug });
    }
  }

  let pages = 0;
  let prosePages = 0;
  const folders = [];
  const slugsByNeed = new Map();
  const llms = [
    "# zedkit docs",
    "",
    "> GENERATED from docs/catalog/catalog.json — do not edit.",
    "",
    "- [Getting started](/docs/getting-started) — choose a package and reach a first result",
    "- [Add SEO to a Next.js app](/docs/add-seo-to-nextjs) — robots, sitemap, metadata, JSON-LD",
    "",
  ];
  for (const [pkg, entry] of sorted) {
    const folder = shortName(pkg);
    const dir = join(outDir, folder);
    mkdirSync(dir, { recursive: true });
    folders.push(folder);
    const version = packageVersion(folder);
    const slugs = [];
    llms.push(`## ${pkg}`, "");
    for (const need of entry.needs) {
      const { slug } = placementByNeed.get(need.need);
      slugs.push(slug);
      slugsByNeed.set(`${pkg} ${need.need}`, { folder, slug });
      const spec = rich[need.need];
      let richBlock = null;
      if (spec) {
        richBlock = {
          demo: spec.demo,
          propsFile: spec.source ?? null,
          propsName: spec.props ?? null,
          registry: spec.registry ?? null,
        };
      }
      const related = (need.seeAlso ?? []).map((target) => {
        const placed = placementByNeed.get(target);
        if (!placed) throw new Error(`generator: "${need.need}" links unknown need "${target}" in See also.`);
        return { title: target, href: `/docs/${placed.folder}/${placed.slug}` };
      });
      const links = related.map((r) => `[${r.title}](${r.href})`);
      const prose = readProse(folder, slug);
      if (prose) prosePages += 1;
      const body =
        richBlock?.registry
          ? componentPageMdx(pkg, need, version, { ...richBlock, registry: richBlock.registry }, related, prose)
          : pageMdx(pkg, need, version, richBlock, links, prose);
      writeFileSync(join(dir, `${slug}.mdx`), body);
      pages += 1;
      llms.push(`- [${need.need}](/docs/${folder}/${slug}) — ${metaDescription(need)}`);
    }
    llms.push("");
    writeFileSync(join(dir, "meta.json"), `${JSON.stringify({ title: pkg, pages: slugs }, null, 2)}\n`);
  }
  const guidePages = writeGuidePages(outDir);
  if (guidePages === 0) throw new Error("prose/guides: expected getting-started.mdx and index.mdx.");
  for (const slug of GUIDE_NAV_SLUGS) {
    if (!existsSync(join(outDir, `${slug}.mdx`))) {
      throw new Error(`prose/guides/${slug}.mdx missing (required guide page).`);
    }
  }
  if (!existsSync(join(outDir, "index.mdx"))) {
    throw new Error("prose/guides/index.mdx missing (docs index).");
  }
  writeFileSync(
    join(outDir, "meta.json"),
    `${JSON.stringify({ title: "Docs", pages: [...GUIDE_NAV_SLUGS, ...folders] }, null, 2)}\n`,
  );
  const publicDir = join(APP, "public");
  mkdirSync(publicDir, { recursive: true });
  writeFileSync(join(publicDir, "llms.txt"), `${llms.join("\n")}\n`);
  // Gallery data: one card per UI need (live demo first, then the rest),
  // catalog stats, and the featured install package — single source.
  const uiPackage = Object.keys(catalog.packages).find((pkg) => shortName(pkg) === "ui") ?? null;
  if (!uiPackage) throw new Error('gallery: no package with short name "ui" in the catalog.');
  const live = [];
  const rest = [];
  for (const need of catalog.packages[uiPackage].needs) {
    const spec = rich[need.need];
    const placed = slugsByNeed.get(`${uiPackage} ${need.need}`);
    if (!placed) continue;
    const card = {
      href: `/docs/${placed.folder}/${placed.slug}`,
      title: cardTitle(need, spec),
      need: need.need,
      status: need.status,
      detail: need.import.replace(/`/g, ""),
      demo: spec ? spec.demo : null,
    };
    (spec ? live : rest).push(card);
  }
  const gallery = [...live, ...rest];
  const stats = {
    packages: Object.keys(catalog.packages).length,
    needs: Object.values(catalog.packages).reduce((n, entry) => n + entry.needs.length, 0),
  };
  const uiVersion = packageVersion("ui");
  const uiChangelogUrl =
    "https://github.com/zedtech-fr/zedkit/blob/main/packages/ui/CHANGELOG.md";
  const galleryModule = `// GENERATED from docs/catalog/catalog.json — do not edit.\nexport interface GalleryCard {\n  href: string;\n  title: string;\n  need: string;\n  status: string;\n  detail: string;\n  demo: string | null;\n}\n\nexport const gallery: GalleryCard[] = ${JSON.stringify(gallery, null, 2)};\n\nexport const catalogStats: { packages: number; needs: number } = ${JSON.stringify(stats)};\n\nexport const featuredPackage: string = ${JSON.stringify(uiPackage)};\n\nexport const featuredPackageVersion: string = ${JSON.stringify(uiVersion)};\n\nexport const featuredPackageChangelogUrl: string = ${JSON.stringify(uiChangelogUrl)};\n\nexport const uiGalleryStats: { components: number; livePreviews: number } = ${JSON.stringify({
    components: gallery.length,
    livePreviews: gallery.filter((card) => card.demo).length,
  })};\n`;
  const homeScenarios = buildHomeScenarios(slugsByNeed, catalog);
  const scenariosModule = `// GENERATED from home-scenarios.json + catalog slugs — do not edit.\nexport interface HomeScenario {\n  situation: string;\n  goal: string;\n  action: string;\n  href: string;\n}\n\nexport const homeScenarios: HomeScenario[] = ${JSON.stringify(homeScenarios, null, 2)};\n`;
  const registryBricks = loadRegistryBrickNames(ROOT);
  const registrySiteModule = `// GENERATED from registry.json — do not edit.\nexport const registryBrickNames: string[] = ${JSON.stringify(registryBricks)};\n\nexport const featuredRegistryBrick: string = ${JSON.stringify(registryBricks[0])};\n`;
  return {
    pages,
    prosePages,
    guidePages,
    folders,
    gallery,
    stats,
    uiPackage,
    galleryModule,
    homeScenarios,
    scenariosModule,
    registrySiteModule,
  };
}

function buildHomeScenarios(slugsByNeed, catalog) {
  const sourcePath = join(APP, "home-scenarios.json");
  if (!existsSync(sourcePath)) {
    throw new Error("home-scenarios.json missing (apps/docs/home-scenarios.json).");
  }
  const source = JSON.parse(readFileSync(sourcePath, "utf8"));
  const scenarios = [];
  for (const row of source) {
    let pkg = null;
    for (const [name, entry] of Object.entries(catalog.packages)) {
      if (entry.needs.some((need) => need.need === row.catalogNeed)) {
        pkg = name;
        break;
      }
    }
    if (!pkg) throw new Error(`home-scenarios.json: "${row.catalogNeed}" matches no catalog need.`);
    const placed = slugsByNeed.get(`${pkg} ${row.catalogNeed}`);
    if (!placed) throw new Error(`home-scenarios.json: no doc slug for "${row.catalogNeed}".`);
    scenarios.push({
      situation: row.situation,
      goal: row.goal,
      action: row.action,
      href: `/docs/${placed.folder}/${placed.slug}`,
    });
  }
  return scenarios;
}

// Gallery titles are short component names: the curated manifest
// component when rich, else the first symbol in the import line,
// else the need phrase (non-component needs like theming).
function cardTitle(need, spec) {
  if (spec?.component) return spec.component;
  const match = /`([A-Za-z_$][A-Za-z0-9_$]*)`/.exec(need.import ?? "");
  return match ? match[1] : need.need;
}

const invoked = process.argv[1] ? resolve(process.argv[1]) : null;
if (invoked === fileURLToPath(import.meta.url)) {
  const outDir = process.argv[2] ? resolve(process.argv[2]) : join(APP, "content", "docs");
  if (!existsSync(join(ROOT, "docs", "catalog", "catalog.json"))) {
    console.error("error: docs/catalog/catalog.json missing (run pnpm catalog:build at the root).");
    process.exitCode = 1;
  } else {
    const { pages, folders, galleryModule, scenariosModule, registrySiteModule } = generate(outDir);
    writeFileSync(join(APP, "content", "gallery.ts"), galleryModule);
    writeFileSync(join(APP, "content", "home-scenarios.ts"), scenariosModule);
    writeFileSync(join(APP, "content", "registry-site.ts"), registrySiteModule);
    console.log(`docs: generated ${pages} pages in ${folders.length} folders -> ${outDir}.`);
  }
}
