/** Shared route helpers for the docs-render mapper and the sitemap sweep. */

/** Extra routes the sweep covers even when sitemap.xml omits them. */
export const EXTRA_SITEMAP_ROUTES = [
  "/features/identity-editor",
  "/features/identity-kit-demos",
  "/issues",
];

export function normalizeRoute(route) {
  const n = route.replaceAll("\\", "/");
  return n.startsWith("/") ? n : `/${n}`;
}

export function parseSitemapRoutes(xml) {
  return [...xml.matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map(
    (m) => m[1].replace(/\/$/u, "") || "/",
  );
}
