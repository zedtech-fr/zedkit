// Docs content generator (spike): catalog.json -> Fumadocs MDX pages.
//
// - `node scripts/generate.mjs [outDir]` regenerates every catalog need
//   as an MDX page (badge, install tabs with the changesets version,
//   catalog example, wraps line) plus per-folder meta.json nav files.
// - Needs listed in docs-manifest.json also get a live preview (the
//   REAL workspace component via components/component-preview.tsx, which
//   resolves the demo through components/demos/registry.ts) and a props
//   table resolved at build by fumadocs-typescript AutoTypeTable
//   (via components/props-table.tsx, inherited props expanded).
// - Also writes public/llms.txt (same source, always current).
//
// Pure derivation: no hand-written content per need, so pages cannot
// drift from the catalog. The docs check (scripts/check.mjs) runs this
// to a temp dir and asserts full coverage.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, "..");
const ROOT = join(APP, "..", "..");

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

function pageMdx(pkg, need, version, rich) {
  const head = [
    "---",
    `title: ${JSON.stringify(need.need)}`,
    `description: ${JSON.stringify(`${pkg} — ${need.status}`)}`,
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
  if (rich && rich.propsFile && rich.propsName) {
    head.push("## Props", "", `<PropsTable file="${rich.propsFile}" name="${rich.propsName}" />`, "");
  }
  return head.join("\n");
}

export function generate(outDir) {
  const catalog = JSON.parse(readFileSync(join(ROOT, "docs", "catalog", "catalog.json"), "utf8"));
  const manifest = JSON.parse(readFileSync(join(APP, "docs-manifest.json"), "utf8"));
  const rich = manifest.rich ?? {};

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  let pages = 0;
  const folders = [];
  const slugsByNeed = new Map();
  const llms = ["# zedkit docs", "", "> GENERATED from docs/catalog/catalog.json — do not edit.", ""];
  for (const [pkg, entry] of Object.entries(catalog.packages).sort(([a], [b]) => a.localeCompare(b))) {
    const folder = shortName(pkg);
    const dir = join(outDir, folder);
    mkdirSync(dir, { recursive: true });
    folders.push(folder);
    const version = packageVersion(folder);
    const slugs = [];
    const seen = new Set();
    llms.push(`## ${pkg}`, "");
    for (const need of entry.needs) {
      let slug = slugify(need.need);
      for (let i = 2; seen.has(slug); i++) slug = `${slugify(need.need)}-${i}`;
      seen.add(slug);
      slugs.push(slug);
      slugsByNeed.set(`${pkg} ${need.need}`, { folder, slug });
      const spec = rich[need.need];
      let richBlock = null;
      if (spec) {
        richBlock = { demo: spec.demo, propsFile: spec.source ?? null, propsName: spec.props ?? null };
      }
      writeFileSync(join(dir, `${slug}.mdx`), pageMdx(pkg, need, version, richBlock));
      pages += 1;
      llms.push(`- [${need.need}](/docs/${folder}/${slug}) — ${need.status}`);
    }
    llms.push("");
    writeFileSync(join(dir, "meta.json"), `${JSON.stringify({ title: pkg, pages: slugs }, null, 2)}\n`);
  }
  writeFileSync(join(outDir, "meta.json"), `${JSON.stringify({ title: "Docs", pages: folders }, null, 2)}\n`);
  writeFileSync(
    join(outDir, "index.mdx"),
    [
      "---",
      'title: "Documentation"',
      'description: "Generated from the kit catalog — every page carries its maturity badge."',
      "---",
      "",
      "{/* GENERATED from docs/catalog/catalog.json — do not edit. */}",
      "",
      "Every page below is generated from the catalog: badges, install commands, and examples cannot drift.",
      "",
    ].join("\n"),
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
  const galleryModule = `// GENERATED from docs/catalog/catalog.json — do not edit.\nexport interface GalleryCard {\n  href: string;\n  title: string;\n  need: string;\n  status: string;\n  detail: string;\n  demo: string | null;\n}\n\nexport const gallery: GalleryCard[] = ${JSON.stringify(gallery, null, 2)};\n\nexport const catalogStats: { packages: number; needs: number } = ${JSON.stringify(stats)};\n\nexport const featuredPackage: string = ${JSON.stringify(uiPackage)};\n\nexport const uiGalleryStats: { components: number; livePreviews: number } = ${JSON.stringify({
    components: gallery.length,
    livePreviews: gallery.filter((card) => card.demo).length,
  })};\n`;
  const homeScenarios = buildHomeScenarios(slugsByNeed, catalog);
  const scenariosModule = `// GENERATED from home-scenarios.json + catalog slugs — do not edit.\nexport interface HomeScenario {\n  situation: string;\n  goal: string;\n  action: string;\n  href: string;\n}\n\nexport const homeScenarios: HomeScenario[] = ${JSON.stringify(homeScenarios, null, 2)};\n`;
  return { pages, folders, gallery, stats, uiPackage, galleryModule, homeScenarios, scenariosModule };
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
    const { pages, folders, galleryModule, scenariosModule } = generate(outDir);
    writeFileSync(join(APP, "content", "gallery.ts"), galleryModule);
    writeFileSync(join(APP, "content", "home-scenarios.ts"), scenariosModule);
    console.log(`docs: generated ${pages} pages in ${folders.length} folders -> ${outDir}.`);
  }
}
