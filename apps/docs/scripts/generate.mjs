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
  // Landing grid data: slug + status + demo per rich need (single source).
  const richCards = [];
  for (const [pkg, entry] of Object.entries(catalog.packages)) {
    for (const need of entry.needs) {
      const spec = rich[need.need];
      const placed = slugsByNeed.get(`${pkg} ${need.need}`);
      if (spec && placed) {
        richCards.push({
          href: `/docs/${placed.folder}/${placed.slug}`,
          title: spec.component,
          status: need.status,
          demo: spec.demo,
        });
      }
    }
  }
  const cardsModule = `// GENERATED from docs/catalog/catalog.json — do not edit.\nexport interface RichCardData {\n  href: string;\n  title: string;\n  status: string;\n  demo: string;\n}\n\nexport const richCards: RichCardData[] = ${JSON.stringify(richCards, null, 2)};\n`;
  writeFileSync(join(outDir, "..", "rich-cards.ts"), cardsModule);
  return { pages, folders };
}

const invoked = process.argv[1] ? resolve(process.argv[1]) : null;
if (invoked === fileURLToPath(import.meta.url)) {
  const outDir = process.argv[2] ? resolve(process.argv[2]) : join(APP, "content", "docs");
  if (!existsSync(join(ROOT, "docs", "catalog", "catalog.json"))) {
    console.error("error: docs/catalog/catalog.json missing (run pnpm catalog:build at the root).");
    process.exitCode = 1;
  } else {
    const { pages, folders } = generate(outDir);
    console.log(`docs: generated ${pages} pages in ${folders.length} folders -> ${outDir}.`);
  }
}
