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

function pageMdx(pkg, need, version, rich, seeAlsoLinks) {
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
  const folders = [];
  const slugsByNeed = new Map();
  const llms = ["# zedkit docs", "", "> GENERATED from docs/catalog/catalog.json — do not edit.", ""];
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
        richBlock = { demo: spec.demo, propsFile: spec.source ?? null, propsName: spec.props ?? null };
      }
      // catalog:check rejects unknown See also targets, so a miss here
      // is a generator bug — fail loudly instead of emitting dead links.
      const links = (need.seeAlso ?? []).map((target) => {
        const placed = placementByNeed.get(target);
        if (!placed) throw new Error(`generator: "${need.need}" links unknown need "${target}" in See also.`);
        return `[${target}](/docs/${placed.folder}/${placed.slug})`;
      });
      writeFileSync(join(dir, `${slug}.mdx`), pageMdx(pkg, need, version, richBlock, links));
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
  const galleryModule = `// GENERATED from docs/catalog/catalog.json — do not edit.\nexport interface GalleryCard {\n  href: string;\n  title: string;\n  need: string;\n  status: string;\n  detail: string;\n  demo: string | null;\n}\n\nexport const gallery: GalleryCard[] = ${JSON.stringify(gallery, null, 2)};\n\nexport const catalogStats: { packages: number; needs: number } = ${JSON.stringify(stats)};\n\nexport const featuredPackage: string = ${JSON.stringify(uiPackage)};\n`;
  return { pages, folders, gallery, stats, uiPackage, galleryModule };
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
    const { pages, folders, galleryModule } = generate(outDir);
    writeFileSync(join(APP, "content", "gallery.ts"), galleryModule);
    console.log(`docs: generated ${pages} pages in ${folders.length} folders -> ${outDir}.`);
  }
}
