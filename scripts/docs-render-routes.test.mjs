import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { parseSitemapRoutes } from "../apps/docs/scripts/docs-route-parse.mjs";
import {
  DOCS_RENDER_FALLBACK_ROUTES,
  docsRenderLooks,
  docsRenderRoutes,
  docsRenderSweepMode,
  looksGridTriggered,
  routesFromFiles,
} from "./docs-render-routes.mjs";

const buttonManifest = {
  rich: {
    "Trigger actions with buttons": { source: "button/button.tsx" },
  },
};

const liveSitemap = [
  "/",
  "/docs",
  "/docs/ui/trigger-actions-with-buttons",
  "/catalog",
  "/docs/foundations",
];

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

test("maps guides MDX to /docs/<slug>", () => {
  assert.deepEqual(
    routesFromFiles([
      "apps/docs/prose/guides/foundations.mdx",
      "apps\\docs\\prose\\guides\\index.mdx",
      "apps/docs/prose/guides/snippets/ui-add.sh",
      "README.md",
    ]).sort(),
    ["/docs", "/docs/foundations"],
  );
});

test("docs guide feature modules map to /docs/<slug> when there is no mdx", () => {
  assert.deepEqual(
    routesFromFiles([
      "apps/docs/features/docs/guides/foundations/ui/foundations-color.tsx",
      "apps/docs/features/docs/guides/foundations/i18n/foundations-copy.ts",
      "apps/docs/features/docs/guides/foundations/ui/foundations-hero.test.mjs",
      ".agents/atlas.md",
    ]),
    ["/docs/foundations"],
  );
  assert.deepEqual(
    routesFromFiles([
      "apps\\docs\\features\\docs\\guides\\maturity-and-compatibility\\ui\\maturity-compatibility-view.tsx",
    ]),
    ["/docs/maturity-and-compatibility"],
  );
  assert.deepEqual(
    routesFromFiles(["apps/docs/features/docs/guides/foundations/ui/foundations-hero.test.mjs"]),
    [],
  );
});

test("maps AI setup sources to /docs/ai/setup", () => {
  assert.deepEqual(
    routesFromFiles(["packages/ai/kit/cursor-onboarding.md", "apps/docs/public/ai/setup.md"]).sort(),
    ["/docs/ai/setup"],
  );
});

test("AI setup sources map to the walkthrough, not the host fallback", () => {
  assert.deepEqual(
    docsRenderRoutes({
      files: ["packages/ai/kit/cursor-onboarding.md"],
      manifest: buttonManifest,
    }),
    ["/docs/ai/setup"],
  );
});

test("public review files map to /issues", () => {
  assert.deepEqual(routesFromFiles(["apps/docs/features/reviews/ui/review-console-view.tsx"]), [
    "/issues",
  ]);
  assert.deepEqual(routesFromFiles(["apps/docs/app/(run-console)/issues/[n]/runs/[id]/page.tsx"]), [
    "/issues",
  ]);
  assert.deepEqual(routesFromFiles(["apps/docs/tests/evidence/issues/issues-list-1440.png"]), [
    "/issues",
  ]);
  assert.deepEqual(routesFromFiles(["apps/docs/scripts/issues-evidence-artifacts.test.mjs"]), [
    "/issues",
  ]);
});

test("reviews diffs map to /issues even when run URLs are still in the sitemap", () => {
  assert.deepEqual(
    docsRenderRoutes({
      files: ["apps/docs/features/reviews/ui/review-console-surfaces.css"],
      manifest: buttonManifest,
      sitemapRoutes: ["/", "/issues", "/issues/108/runs/run-108-impl", "/issues/93/runs/run-93-impl"],
    }),
    ["/issues"],
  );
});

test("docs identity feature modules map to the editor route", () => {
  assert.deepEqual(
    routesFromFiles([
      "apps/docs/features/identity/ui/identity-look.ts",
      "apps/docs/features/identity/ui/identity-editor-panel.tsx",
      "apps/docs/features/identity/ui/identity-look.test.mjs",
      ".agents/atlas.md",
    ]),
    ["/features/identity-editor"],
  );
  assert.deepEqual(
    routesFromFiles(["apps\\docs\\features\\identity\\ui\\identity-editor-draft.ts"]),
    ["/features/identity-editor"],
  );
  assert.deepEqual(routesFromFiles(["apps/docs/features/identity/ui/identity-look.test.mjs"]), []);
});

test("docs home route-group files map to / when there is no page.tsx", () => {
  assert.deepEqual(
    routesFromFiles([
      "apps/docs/app/(home)/_home/home-identity-looks.tsx",
      "apps/docs/app/(home)/_home/home-identity-looks.test.mjs",
      ".agents/atlas.md",
    ]),
    ["/"],
  );
  assert.deepEqual(
    routesFromFiles(["apps\\docs\\app\\(home)\\_home\\home-identity-looks.tsx"]),
    ["/"],
  );
  assert.deepEqual(routesFromFiles(["apps/docs/app/(home)/_home/home-identity-looks.test.mjs"]), []);
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

test("deleted page that maps but is gone from the sitemap uses the fallback", () => {
  assert.deepEqual(
    docsRenderRoutes({
      files: ["apps/docs/app/(site)/retired/page.tsx"],
      manifest: buttonManifest,
      sitemapRoutes: liveSitemap,
    }),
    DOCS_RENDER_FALLBACK_ROUTES,
  );
});

test("mapped-but-gone still fails closed when the fallback is also unpublished", () => {
  assert.deepEqual(
    docsRenderRoutes({
      files: ["apps/docs/app/(site)/retired/page.tsx"],
      manifest: buttonManifest,
      sitemapRoutes: ["/secret"],
    }),
    [],
  );
});

test("EXTRA sitemap route not in xml stays in the mapped set", () => {
  assert.deepEqual(
    docsRenderRoutes({
      files: ["apps/docs/app/(site)/features/identity-editor/page.tsx"],
      manifest: buttonManifest,
      sitemapRoutes: ["/", "/catalog"],
    }),
    ["/features/identity-editor"],
  );
});

test("empty file list still uses the fallback, never all-routes", () => {
  assert.deepEqual(docsRenderRoutes({ files: [], manifest: buttonManifest }), DOCS_RENDER_FALLBACK_ROUTES);
});

test("parseSitemapRoutes reads loc paths and strips a trailing slash", () => {
  assert.deepEqual(
    parseSitemapRoutes(
      "<url><loc>https://zedkit.app/catalog</loc></url><url><loc>https://zedkit.app/docs/</loc></url><url><loc>https://zedkit.app/</loc></url>",
    ),
    ["/catalog", "/docs", "/"],
  );
});

test("mapper and route-parse have no package imports", () => {
  const mapper = readFileSync(new URL("./docs-render-routes.mjs", import.meta.url), "utf8");
  const parse = readFileSync(new URL("../apps/docs/scripts/docs-route-parse.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(mapper, /from ["'](?!node:|\.)/u);
  assert.doesNotMatch(parse, /from ["']/u);
});

test("turns the looks grid on for tokens, primitives, and identity sheets", () => {
  assert.equal(looksGridTriggered(["packages/ui/src/identities.css"]), true);
  assert.equal(looksGridTriggered(["packages/ui/src/styles.css"]), true);
  assert.equal(looksGridTriggered(["packages/ui/src/button/button.tsx"]), true);
  assert.equal(looksGridTriggered(["packages/ui/src/button/button.test.tsx"]), false);
  assert.equal(looksGridTriggered(["README.md"]), false);
  assert.equal(looksGridTriggered(["apps/docs/app/(site)/catalog/page.tsx"]), false);
  assert.equal(looksGridTriggered(["packages\\ui\\src\\identities.css"]), true);
});

test("keeps the looks grid off for a per-id identity sheet", () => {
  assert.equal(looksGridTriggered(["packages/ui/src/identities/glass.css"]), false);
  assert.equal(looksGridTriggered(["packages\\ui\\src\\identities\\glass.css"]), false);
  assert.equal(looksGridTriggered(["packages/ui/src/identities.css"]), true);
});

test("docsRenderLooks emits the six shipped looks only when the grid is on", () => {
  assert.deepEqual(docsRenderLooks(["packages/ui/src/styles.css"]), [
    "mist",
    "press",
    "tide",
    "volt",
    "maison",
    "glass",
  ]);
  assert.deepEqual(docsRenderLooks(["packages/ui/src/button/button.tsx"]), [
    "mist",
    "press",
    "tide",
    "volt",
    "maison",
    "glass",
  ]);
  assert.deepEqual(docsRenderLooks(["apps/docs/app/(site)/catalog/page.tsx"]), []);
  assert.deepEqual(docsRenderLooks(["README.md"]), []);
});

test("--looks writes the six ids or a blank line", () => {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const run = (input) =>
    spawnSync(process.execPath, ["scripts/docs-render-routes.mjs", "--looks"], {
      cwd: root,
      encoding: "utf8",
      input,
    });
  const on = run("packages/ui/src/styles.css\n");
  assert.equal(on.status, 0, on.stderr);
  assert.equal(on.stdout, "mist,press,tide,volt,maison,glass\n");
  const off = run("apps/docs/app/(site)/catalog/page.tsx\n");
  assert.equal(off.status, 0, off.stderr);
  assert.equal(off.stdout, "\n");
});

test("slugNeed, routesFromFiles, and looksGridTriggered stay in lockstep with visual-verify.mjs", () => {
  const mapper = readFileSync(new URL("./docs-render-routes.mjs", import.meta.url), "utf8");
  const verify = readFileSync(new URL("../packages/ai/scripts/visual-verify.mjs", import.meta.url), "utf8");
  for (const name of ["slugNeed", "routesFromFiles", "looksGridTriggered"]) {
    assert.equal(exportedFn(mapper, name), exportedFn(verify, name), `${name} drifted from visual-verify.mjs`);
  }
  const looksConst = (src) => {
    const match = /export const DEFAULT_LOOKS = (\[[^\]]+\])/u.exec(src);
    assert.ok(match, "missing DEFAULT_LOOKS");
    return match[1];
  };
  assert.equal(looksConst(mapper), looksConst(verify), "DEFAULT_LOOKS drifted from visual-verify.mjs");
});

test("ordinary PR into dev stays on touched routes", () => {
  assert.equal(
    docsRenderSweepMode({ event: "pull_request", baseRef: "dev", headRef: "agent/issue-310" }),
    "touched",
  );
});

test("epic PR into dev is a full sitemap sweep", () => {
  assert.equal(
    docsRenderSweepMode({ event: "pull_request", baseRef: "dev", headRef: "epic/73-redesign" }),
    "full",
  );
});

test("any PR into main is a full sitemap sweep", () => {
  assert.equal(
    docsRenderSweepMode({ event: "pull_request", baseRef: "main", headRef: "dev" }),
    "full",
  );
  assert.equal(
    docsRenderSweepMode({ event: "pull_request", baseRef: "main", headRef: "fix/docs" }),
    "full",
  );
});

test("push is a full sitemap sweep", () => {
  assert.equal(docsRenderSweepMode({ event: "push", baseRef: "", headRef: "" }), "full");
});

test("missing head ref on a PR into dev stays touched", () => {
  assert.equal(docsRenderSweepMode({ event: "pull_request", baseRef: "dev" }), "touched");
  assert.equal(
    docsRenderSweepMode({ event: "pull_request", baseRef: "dev", headRef: "" }),
    "touched",
  );
  assert.equal(
    docsRenderSweepMode({ event: "pull_request", baseRef: "dev", headRef: null }),
    "touched",
  );
});

test("epic- without a slash stays touched", () => {
  assert.equal(
    docsRenderSweepMode({ event: "pull_request", baseRef: "dev", headRef: "epic-73-redesign" }),
    "touched",
  );
});

test("--mode prints full or touched from EVENT BASE_REF HEAD_REF", () => {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const run = (env) =>
    spawnSync(process.execPath, ["scripts/docs-render-routes.mjs", "--mode"], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, ...env },
    });
  const full = run({ EVENT: "push", BASE_REF: "", HEAD_REF: "" });
  assert.equal(full.status, 0, full.stderr);
  assert.equal(full.stdout, "full\n");
  const touched = run({
    EVENT: "pull_request",
    BASE_REF: "dev",
    HEAD_REF: "feat/x",
  });
  assert.equal(touched.status, 0, touched.stderr);
  assert.equal(touched.stdout, "touched\n");
});

function exportedFn(src, name) {
  const start = src.indexOf(`export function ${name}(`);
  assert.notEqual(start, -1, `missing export function ${name}`);
  const open = src.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error(`unclosed ${name}`);
}
