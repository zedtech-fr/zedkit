#!/usr/bin/env node
// Touched-route list for the docs-render job. Dep-free (fs/path only) so it
// runs under the same --filter="@zedtech/zedkit-docs..." install as docs-smoke.
// Keep slugNeed / routesFromFiles in sync with packages/ai/scripts/visual-verify.mjs.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Host `visual:verify --routes` set. Used when the mapper maps nothing. */
export const DOCS_RENDER_FALLBACK_ROUTES = [
  "/",
  "/docs",
  "/docs/ui/trigger-actions-with-buttons",
  "/catalog",
  "/docs/foundations",
];

export function slugNeed(heading) {
  return heading.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");
}

export function routesFromFiles(files, manifest) {
  const routes = new Set();
  const sources = [];
  if (manifest && typeof manifest === "object") {
    const rich = manifest.rich && typeof manifest.rich === "object" ? manifest.rich : manifest;
    for (const [need, entry] of Object.entries(rich)) {
      if (entry && typeof entry === "object" && typeof entry.source === "string") {
        sources.push({ source: entry.source.replaceAll("\\", "/"), route: `/docs/ui/${slugNeed(need)}` });
      }
    }
  }
  for (const file of files) {
    const n = file.replaceAll("\\", "/");
    const page = /\/app\/(.+)\/page\.(?:tsx|jsx|js)$/u.exec(`/${n}`);
    if (page) {
      const inner = page[1] ?? "";
      if (!inner.includes("[")) {
        const segs = inner.split("/").filter((s) => s && !s.startsWith("(") && !s.startsWith("@"));
        routes.add(`/${segs.join("/")}`);
      }
    }
    for (const row of sources) {
      if (n === row.source || n.endsWith(`/${row.source}`)) routes.add(row.route);
    }
  }
  return [...routes];
}

function normalizeRoute(route) {
  const n = route.replaceAll("\\", "/");
  return n.startsWith("/") ? n : `/${n}`;
}

export function docsRenderRoutes({ files, manifest, sitemapRoutes }) {
  const mapped = [...new Set(routesFromFiles(files, manifest).map(normalizeRoute))];
  const chosen = mapped.length > 0 ? mapped : [...DOCS_RENDER_FALLBACK_ROUTES];
  if (!sitemapRoutes) return chosen;
  const allowed = new Set(sitemapRoutes.map(normalizeRoute));
  return chosen.filter((route) => allowed.has(route));
}

export function formatDocsRoutes(routes) {
  return routes.join(",");
}

export function parseSitemapRoutes(xml) {
  return [...xml.matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map(
    (m) => m[1].replace(/\/$/u, "") || "/",
  );
}

function loadManifest(root) {
  const path = join(root, "apps/docs/docs-manifest.json");
  if (!existsSync(path)) {
    throw new Error(`docs-render: missing ${path}`);
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

function loadSitemapRoutes(root) {
  const path = join(root, "apps/docs/out/sitemap.xml");
  if (!existsSync(path)) return undefined;
  return parseSitemapRoutes(readFileSync(path, "utf8"));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = process.cwd();
  const files = readFileSync(0, "utf8").split("\n").filter(Boolean);
  const routes = docsRenderRoutes({
    files,
    manifest: loadManifest(root),
    sitemapRoutes: loadSitemapRoutes(root),
  });
  process.stdout.write(`${formatDocsRoutes(routes)}\n`);
}
