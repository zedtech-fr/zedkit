import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  DOCS_RENDER_FALLBACK_ROUTES,
  docsRenderRoutes,
  formatDocsRoutes,
  routesFromFiles,
} from "./docs-render-routes.mjs";

const buttonManifest = {
  rich: {
    "Trigger actions with buttons": { source: "button/button.tsx" },
  },
};

test("maps App Router pages and manifest sources the same way as routesFromFiles", () => {
  const files = [
    "apps/docs/app/(site)/page.tsx",
    "apps/docs/app/(site)/catalog/page.tsx",
    "packages/ui/src/button/button.tsx",
    "README.md",
  ];
  assert.deepEqual(routesFromFiles(files, buttonManifest).sort(), [
    "/",
    "/catalog",
    "/docs/ui/trigger-actions-with-buttons",
  ]);
});

test("catch-all pages and unknown files do not emit a wildcard", () => {
  assert.deepEqual(routesFromFiles(["apps/docs/app/docs/[[...slug]]/page.tsx"]), []);
  assert.deepEqual(routesFromFiles(["README.md"], buttonManifest), []);
  assert.deepEqual(routesFromFiles([]), []);
});

test("unmapped docs-selected chrome falls back to the host visual:verify routes", () => {
  assert.deepEqual(
    docsRenderRoutes({
      files: ["apps/docs/app/globals.css", "apps/docs/ui/site-layout.tsx"],
      manifest: buttonManifest,
    }),
    DOCS_RENDER_FALLBACK_ROUTES,
  );
  assert.deepEqual(DOCS_RENDER_FALLBACK_ROUTES, [
    "/",
    "/docs",
    "/docs/ui/trigger-actions-with-buttons",
    "/catalog",
    "/docs/foundations",
  ]);
});

test("mapped routes stay unique with leading slashes, including backslash paths", () => {
  const files = [
    "apps\\docs\\app\\(site)\\page.tsx",
    "apps/docs/app/(site)/page.tsx",
    "packages/ui/src/button/button.tsx",
  ];
  assert.deepEqual(docsRenderRoutes({ files, manifest: buttonManifest }).sort(), [
    "/",
    "/docs/ui/trigger-actions-with-buttons",
  ]);
});

test("sitemap intersect drops unknown paths and does not add the fallback", () => {
  assert.deepEqual(
    docsRenderRoutes({
      files: ["apps/docs/app/(site)/catalog/page.tsx", "apps/docs/app/(site)/missing/page.tsx"],
      manifest: buttonManifest,
      sitemapRoutes: ["/", "/catalog", "/docs"],
    }),
    ["/catalog"],
  );
});

test("empty file list still uses the fallback, never all-routes", () => {
  assert.deepEqual(docsRenderRoutes({ files: [], manifest: buttonManifest }), DOCS_RENDER_FALLBACK_ROUTES);
});

test("formatDocsRoutes prints a comma-separated list", () => {
  assert.equal(formatDocsRoutes(["/", "/docs"]), "/,/docs");
});

test("mapper has no package imports", () => {
  const src = readFileSync(new URL("./docs-render-routes.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(src, /from ["'](?!node:)/u);
});
