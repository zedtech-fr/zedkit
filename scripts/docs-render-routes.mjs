#!/usr/bin/env node
// Touched-route list for the docs-render job. Dep-free (fs/path only) so it
// runs under the same --filter="@zedtech/zedkit-docs..." install as docs-smoke.
// Keep slugNeed / routesFromFiles / looksGridTriggered in sync with
// packages/ai/scripts/visual-verify.mjs. Evidence look picking is
// identitiesFromChangedFiles there, not this boolean.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  EXTRA_SITEMAP_ROUTES,
  normalizeRoute,
  parseSitemapRoutes,
} from "../apps/docs/scripts/docs-route-parse.mjs";

export { EXTRA_SITEMAP_ROUTES, normalizeRoute, parseSitemapRoutes };

/** Host `visual:verify --routes` set. Used when the mapper maps nothing. */
export const DOCS_RENDER_FALLBACK_ROUTES = [
  "/",
  "/docs",
  "/docs/ui/trigger-actions-with-buttons",
  "/catalog",
  "/docs/foundations",
];

/** Same six ids as visual-verify `DEFAULT_LOOKS`. Do not import that file. */
export const DEFAULT_LOOKS = ["mist", "press", "tide", "volt", "maison", "glass"];

export function looksGridTriggered(files) {
  return files.some((file) => {
    const n = file.replaceAll("\\", "/");
    if (/identities[^/]*\.css$/iu.test(n)) return true;
    if (/(?:^|\/)(?:tokens?|styles)\.(?:css|ts)$/iu.test(n)) return true;
    if (!/packages\/ui\/src\/.+\.tsx$/u.test(n)) return false;
    return !/\.(?:test|spec)\./u.test(n);
  });
}

export function docsRenderLooks(files) {
  return looksGridTriggered(files) ? [...DEFAULT_LOOKS] : [];
}

/** `"full"` sitemap vs `"touched"` mapper. Event property, not a file list. */
export function docsRenderSweepMode({ event, baseRef, headRef }) {
  if (event === "push") return "full";
  if (event !== "pull_request") return "touched";
  if (baseRef === "main") return "full";
  if (baseRef === "dev" && typeof headRef === "string" && headRef.startsWith("epic/")) {
    return "full";
  }
  return "touched";
}

export function slugNeed(heading) {
  return heading.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");
}

/** Host public-review files. Lockstep with packages/ai/scripts/visual-verify.mjs. */
export function isPublicReviewPath(file) {
  const n = file.replaceAll("\\", "/");
  return (
    /(?:^|\/)apps\/docs\/features\/reviews\//u.test(n) ||
    /(?:^|\/)apps\/docs\/app\/\(run-console\)\//u.test(n) ||
    /(?:^|\/)apps\/docs\/app\/\([^/]+\)\/issues\//u.test(n) ||
    /(?:^|\/)apps\/docs\/tests\/evidence\/issues\//u.test(n) ||
    /(?:^|\/)apps\/docs\/scripts\/issues-evidence-artifacts\.test\.mjs$/u.test(n)
  );
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
    if (isPublicReviewPath(n)) routes.add("/issues");
    for (const row of sources) {
      if (n === row.source || n.endsWith(`/${row.source}`)) routes.add(row.route);
    }
    if (/(?:^|\/)apps\/docs\/features\/identity\//u.test(n) && !/\.(?:test|spec)\./u.test(n)) {
      routes.add("/features/identity-editor");
    }
    if (/(?:^|\/)apps\/docs\/app\/\(home\)\//u.test(n) && !/\.(?:test|spec)\./u.test(n)) {
      routes.add("/");
    }
  }
  return [...routes];
}

/** Index-only run pages in the public sitemap. Live recorded-run URLs 404 when lives are empty. */
const REVIEW_RUN_ROUTES = ["/issues/108/runs/run-108-impl", "/issues/93/runs/run-93-impl"];

function reviewRunRoutesFromFiles(files) {
  const hit = files.some((file) => {
    const n = file.replaceAll("\\", "/");
    return (
      /(?:^|\/)apps\/docs\/features\/reviews\//u.test(n) ||
      /(?:^|\/)apps\/docs\/app\/\(run-console\)\//u.test(n) ||
      /(?:^|\/)apps\/docs\/app\/\([^/]+\)\/issues\//u.test(n)
    );
  });
  return hit ? REVIEW_RUN_ROUTES : [];
}

export function docsRenderRoutes({ files, manifest, sitemapRoutes }) {
  const mapped = [
    ...new Set(
      [...routesFromFiles(files, manifest), ...reviewRunRoutesFromFiles(files)].map(normalizeRoute),
    ),
  ];
  const chosen = mapped.length > 0 ? mapped : [...DOCS_RENDER_FALLBACK_ROUTES];
  if (!sitemapRoutes) return chosen;
  const allowed = new Set([...sitemapRoutes, ...EXTRA_SITEMAP_ROUTES].map(normalizeRoute));
  const live = chosen.filter((route) => allowed.has(route));
  if (live.length > 0) return live;
  // Mapped routes are gone from the sitemap (deleted page) and are not EXTRA.
  // Intersect the fallback so the required gate still has a published green path.
  return DOCS_RENDER_FALLBACK_ROUTES.filter((route) => allowed.has(route));
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
  if (process.argv.includes("--mode")) {
    process.stdout.write(
      `${docsRenderSweepMode({
        event: process.env.EVENT,
        baseRef: process.env.BASE_REF,
        headRef: process.env.HEAD_REF,
      })}\n`,
    );
  } else {
    const root = process.cwd();
    const files = readFileSync(0, "utf8").split("\n").filter(Boolean);
    if (process.argv.includes("--looks")) {
      process.stdout.write(`${docsRenderLooks(files).join(",")}\n`);
    } else {
      const routes = docsRenderRoutes({
        files,
        manifest: loadManifest(root),
        sitemapRoutes: loadSitemapRoutes(root),
      });
      process.stdout.write(`${routes.join(",")}\n`);
    }
  }
}
