// Docs content generator (spike): catalog.json -> Fumadocs MDX pages.
//
// - `node scripts/generate.mjs [outDir]` regenerates every catalog need
//   as an MDX page (badge, install tabs with the changesets version,
//   catalog example, wraps line) plus per-folder meta.json nav files.
// - Needs listed in docs-manifest.json also get a live preview (the
//   REAL workspace component via components/demos.tsx) and a props
//   table parsed from the TypeScript interface (verbatim types).
// - Also writes public/llms.txt (same source, always current).
//
// Pure derivation: no hand-written content per need, so pages cannot
// drift from the catalog. The docs check (scripts/check.mjs) runs this
// to a temp dir and asserts full coverage.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

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

// Syntax-level props extraction (verbatim annotated types + JSDoc).
// Full type resolution (CVA/inherited expansion) is a follow-up.
function parseProps(sourcePath, interfaceName) {
  const text = readFileSync(sourcePath, "utf8");
  const file = ts.createSourceFile(sourcePath, text, ts.ScriptTarget.Latest, true);
  const rows = [];
  const heritage = [];
  const visit = (node) => {
    if (ts.isInterfaceDeclaration(node) && node.name.text === interfaceName) {
      for (const member of node.members) {
        if (!ts.isPropertySignature(member) || !member.name) continue;
        const name = member.name.getText(file);
        const type = member.type ? member.type.getText(file) : "unknown";
        const required = member.questionToken === undefined;
        const docs = ts.getJSDocCommentsAndTags(member).map((d) => d.comment ?? "");
        const jsdoc = Array.isArray(docs) ? docs.filter(Boolean).join(" ") : "";
        rows.push({ name, type, required, description: typeof jsdoc === "string" ? jsdoc : "" });
      }
      for (const clause of node.heritageClauses ?? []) {
        for (const t of clause.types) heritage.push(t.getText(file));
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return { rows, heritage };
}

function propsTable(parsed) {
  const lines = ["| Prop | Type | Required | Description |", "|---|---|---|---|"];
  for (const row of parsed.rows) {
    const safe = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
    lines.push(`| \`${safe(row.name)}\` | \`${safe(row.type)}\` | ${row.required ? "yes" : "no"} | ${safe(row.description)} |`);
  }
  if (parsed.heritage.length > 0) {
    lines.push("", `Also inherits: ${parsed.heritage.map((h) => `\`${h}\``).join(", ")}.`);
  }
  return lines.join("\n");
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
  ];
  if (rich) head.push(`import { ${rich.demo} } from "../../../components/demos";`);
  head.push("", `<Badge>${need.status}</Badge>`, "");
  if (rich) head.push("## Preview", "", `<${rich.demo} />`, "");
  head.push(
    "## Install",
    "",
    "```sh title=\"pnpm\"",
    `pnpm add ${pkg}`,
    "```",
    "",
    "```sh title=\"npm\"",
    `npm install ${pkg}`,
    "```",
    "",
    "```sh title=\"yarn\"",
    `yarn add ${pkg}`,
    "```",
    "",
    `Latest: \`${version}\` (via changesets).`,
    "",
    "## Example",
    "",
    "```ts",
    need.example,
    "```",
    "",
    `Wraps: ${need.wraps}`,
    "",
  );
  if (rich && rich.propsTable) {
    head.push("## Props", "", rich.propsTable, "");
  }
  return head.join("\n");
}

export function generate(outDir) {
  const catalog = JSON.parse(readFileSync(join(ROOT, "docs", "catalog", "catalog.json"), "utf8"));
  const manifest = JSON.parse(readFileSync(join(APP, "docs-manifest.json"), "utf8"));
  const rich = manifest.rich ?? {};
  const uiDir = join(ROOT, "packages", "ui", "src");

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
        const table =
          spec.props && spec.source ? propsTable(parseProps(join(uiDir, spec.source), spec.props)) : null;
        richBlock = { demo: spec.demo, propsTable: table };
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
