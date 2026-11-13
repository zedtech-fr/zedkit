import { normalizeRoute } from "./docs-route-parse.mjs";

/**
 * Restrict a published-route list to `DOCS_ROUTES`. Unset = every route.
 * Set-but-blank (or no overlap with the sitemap) fails closed so a mapper
 * bug cannot silently sweep the whole sitemap.
 */
export function filterPublishedRoutes(published, envValue) {
  if (envValue === undefined) return published;
  const wanted = envValue
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map(normalizeRoute);
  if (wanted.length === 0) {
    throw new Error("DOCS_ROUTES is set but empty; refusing to sweep all routes");
  }
  const allowed = new Set(wanted);
  const hit = published.filter((route) => allowed.has(normalizeRoute(route)));
  if (hit.length === 0) {
    throw new Error("DOCS_ROUTES matched no published route; refusing to sweep all routes");
  }
  return hit;
}
