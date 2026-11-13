import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { EXTRA_SITEMAP_ROUTES, parseSitemapRoutes } from "../scripts/docs-route-parse.mjs";
import { filterPublishedRoutes } from "../scripts/docs-routes-env.mjs";

export { EXTRA_SITEMAP_ROUTES };

function sitemapCandidates(): string[] {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return [path.join(process.cwd(), "out/sitemap.xml"), path.join(here, "../out/sitemap.xml")];
}

/**
 * Published docs routes from the static-export sitemap. CI builds docs before
 * `e2e:routes`, so `apps/docs/out/sitemap.xml` exists at collection time and
 * every shard sees the same list (required for Playwright `--shard`).
 */
export function publishedRoutes(): string[] {
  const sitemapPath = sitemapCandidates().find((file) => existsSync(file));
  if (!sitemapPath) {
    throw new Error("apps/docs/out/sitemap.xml is missing; build the docs static export before e2e:routes");
  }
  const paths = parseSitemapRoutes(readFileSync(sitemapPath, "utf8"));
  return [...new Set([...paths, ...EXTRA_SITEMAP_ROUTES])].sort();
}

/** Sitemap routes, restricted to `DOCS_ROUTES` when that env is set. */
export function routesForSweep(): string[] {
  return filterPublishedRoutes(publishedRoutes(), process.env.DOCS_ROUTES);
}
