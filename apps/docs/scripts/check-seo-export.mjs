// Validates metadata, sitemap, robots and llms.txt in the static export (apps/docs/out).
// Run after `pnpm exec turbo run build --filter=@zedtech/zedkit-docs`.
//
// Usage: `node scripts/check-seo-export.mjs [outDir]`
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, "..");
const OUT = resolve(process.argv[2] ?? join(APP, "out"));
const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://zedkit.app").replace(/\/$/, "");

const errors = [];
let sitemapUrlCount = 0;

function fail(message) {
  errors.push(message);
}

function requireFile(rel) {
  const file = join(OUT, rel);
  if (!existsSync(file)) {
    fail(`missing ${rel} (run the docs static export build first).`);
    return null;
  }
  return file;
}

function assertMeta(htmlPath, label, canonicalHref, { requireJsonLd = true } = {}) {
  const html = readFileSync(htmlPath, "utf8");
  if (!html.includes('rel="canonical"')) {
    fail(`${label}: missing canonical link`);
  } else {
    const homeAlt = canonicalHref === `${base}/` ? `href="${base}"` : null;
    const ok = html.includes(`href="${canonicalHref}"`) || (homeAlt !== null && html.includes(homeAlt));
    if (!ok) {
      fail(`${label}: canonical must be ${canonicalHref}`);
    }
  }
  for (const prop of ["og:title", "og:description", "og:image", "og:url"]) {
    if (!html.includes(`property="${prop}"`)) {
      fail(`${label}: missing meta property ${prop}`);
    }
  }
  if (!html.includes('name="twitter:card"')) {
    fail(`${label}: missing twitter:card meta`);
  }
  if (requireJsonLd && !html.includes("application/ld+json")) {
    fail(`${label}: missing JSON-LD script`);
  }
}

function firstDocHtml() {
  const docsDir = join(OUT, "docs");
  if (!existsSync(docsDir)) return null;
  const stack = [docsDir];
  while (stack.length > 0) {
    const dir = stack.pop();
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) stack.push(path);
      else if (entry.name.endsWith(".html") && entry.name !== "docs.html") return path;
    }
  }
  return null;
}

const robotsPath = requireFile("robots.txt");
if (robotsPath) {
  const robots = readFileSync(robotsPath, "utf8");
  if (!robots.includes(`Sitemap: ${base}/sitemap.xml`)) {
    fail("robots.txt: missing Sitemap line for the site");
  }
  if (!/Allow:\s*\//.test(robots)) {
    fail("robots.txt: missing Allow /");
  }
}

const sitemapPath = requireFile("sitemap.xml");
if (sitemapPath) {
  const sitemap = readFileSync(sitemapPath, "utf8");
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  sitemapUrlCount = locs.length;
  if (locs.length < 3) {
    fail(`sitemap.xml: expected at least 3 URLs, got ${locs.length}`);
  }
  for (const loc of locs) {
    if (!loc.startsWith(`${base}/`) && loc !== `${base}/`) {
      fail(`sitemap.xml: URL not on site: ${loc}`);
    }
  }
  if (!locs.includes(`${base}/`)) {
    fail("sitemap.xml: missing home URL");
  }
  if (!locs.includes(`${base}/docs`)) {
    fail("sitemap.xml: missing /docs URL");
  }
}

const llmsPath = requireFile("llms.txt");
if (llmsPath) {
  const llms = readFileSync(llmsPath, "utf8");
  if (!llms.startsWith("# zedkit docs")) {
    fail("llms.txt: expected generated zedkit docs header");
  }
}

const homePath = requireFile("index.html");
if (homePath) {
  assertMeta(homePath, "index.html", `${base}/`);
}

const notFoundPath = requireFile("404.html");
if (notFoundPath) {
  const html = readFileSync(notFoundPath, "utf8");
  if (!html.includes('content="noindex')) {
    fail("404.html: expected robots noindex metadata");
  }
  if (html.includes("application/ld+json")) {
    fail("404.html: must not ship indexable JSON-LD");
  }
}

const docsIndex = requireFile("docs.html");
if (docsIndex) {
  assertMeta(docsIndex, "docs.html", `${base}/docs`);
}

const sampleDoc = firstDocHtml();
if (!sampleDoc) {
  fail("docs export: no sample .html page under docs/");
} else {
  const rel = sampleDoc.slice(OUT.length).replace(/\.html$/, "");
  assertMeta(sampleDoc, rel, `${base}${rel}`);
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`docs-seo-export: ok (${OUT}, ${sitemapUrlCount} sitemap URLs checked).`);
}
