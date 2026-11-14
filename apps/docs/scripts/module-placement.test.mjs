import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import {
  REQUIRED_EDGES,
  REQUIRED_GLOBS,
  baselineGrowth,
  buildDocsGraph,
  checkDocsBaseline,
  checkPlacement,
  landTimeBaseline,
  writeLandTimeBaseline,
} from "./module-placement.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const docsRoot = join(here, "..");
const repoRoot = join(docsRoot, "../..");
const baselinePath = join(here, "module-placement.baseline.json");

function ids(items) {
  return items.map((v) =>
    v.kind === "cross-feature" || v.kind === "private-leak"
      ? `${v.kind}:${v.from}->${v.to}`
      : `${v.kind}:${v.file ?? v.glob}`,
  );
}

describe("checkPlacement fixtures", () => {
  it("fails a components file with one owner", () => {
    const result = checkPlacement(
      {
        files: ["app/x/page.tsx", "components/foo.ts"],
        edges: [{ from: "app/x/page.tsx", to: "components/foo.ts" }],
      },
      { dead: [], singleOwner: [], globs: [], edges: [] },
    );
    assert.deepEqual(ids(result.newViolations), ["single-owner:components/foo.ts"]);
    assert.deepEqual(result.stale, []);
  });

  it("does not flag a components file whose only owner is app/layout.tsx", () => {
    const result = checkPlacement(
      {
        files: ["app/layout.tsx", "components/skip-link.tsx"],
        edges: [{ from: "app/layout.tsx", to: "components/skip-link.tsx" }],
      },
      { dead: [], singleOwner: [], globs: [], edges: [] },
    );
    assert.deepEqual(result.newViolations, []);
    assert.deepEqual(result.stale, []);
  });

  it("still flags a components file whose only owner is a nested layout", () => {
    const result = checkPlacement(
      {
        files: ["app/(home)/layout.tsx", "components/home-only.tsx"],
        edges: [{ from: "app/(home)/layout.tsx", to: "components/home-only.tsx" }],
      },
      { dead: [], singleOwner: [], globs: [], edges: [] },
    );
    assert.deepEqual(ids(result.newViolations), ["single-owner:components/home-only.tsx"]);
  });

  it("treats an empty committed baseline on a clean graph as no new and no stale", () => {
    const result = checkPlacement(
      {
        files: ["app/x/page.tsx", "app/y/page.tsx", "components/foo.ts"],
        edges: [
          { from: "app/x/page.tsx", to: "components/foo.ts" },
          { from: "app/y/page.tsx", to: "components/foo.ts" },
        ],
      },
      { dead: [], singleOwner: [], globs: [], edges: [] },
    );
    assert.deepEqual(result.newViolations, []);
    assert.deepEqual(result.stale, []);
  });

  it("passes a components file with two owners", () => {
    const result = checkPlacement(
      {
        files: ["app/x/page.tsx", "app/y/page.tsx", "components/foo.ts"],
        edges: [
          { from: "app/x/page.tsx", to: "components/foo.ts" },
          { from: "app/y/page.tsx", to: "components/foo.ts" },
        ],
      },
      { dead: [], singleOwner: [], globs: [], edges: [] },
    );
    assert.deepEqual(result.newViolations, []);
  });

  it("passes a demos file with one owner", () => {
    const result = checkPlacement(
      {
        files: ["app/x/page.tsx", "components/demos/foo-demo.tsx"],
        edges: [{ from: "app/x/page.tsx", to: "components/demos/foo-demo.tsx" }],
      },
      { dead: [], singleOwner: [], globs: [], edges: [] },
    );
    assert.deepEqual(result.newViolations, []);
  });

  it("fails a lib file with zero owners", () => {
    const result = checkPlacement(
      {
        files: ["app/x/page.tsx", "lib/bar.ts"],
        edges: [],
      },
      { dead: [], singleOwner: [], globs: [], edges: [] },
    );
    assert.deepEqual(ids(result.newViolations), ["dead:lib/bar.ts"]);
  });

  it("keeps the generated-page corpus owner when SHARED_OWNER enters a feature", () => {
    const result = checkPlacement(
      {
        files: ["features/docs/ui/component-page.tsx", "lib/adoption-plan.mjs"],
        edges: [
          { from: "docs", to: "features/docs/ui/component-page.tsx" },
          { from: "features/docs/ui/component-page.tsx", to: "lib/adoption-plan.mjs" },
        ],
      },
      { dead: [], singleOwner: [], globs: [], edges: [] },
    );
    assert.deepEqual(result.newViolations, []);
  });

  it("fails a stale dead baseline entry whose file is now reachable", () => {
    const result = checkPlacement(
      {
        files: ["app/x/page.tsx", "app/y/page.tsx", "lib/bar.ts"],
        edges: [
          { from: "app/x/page.tsx", to: "lib/bar.ts" },
          { from: "app/y/page.tsx", to: "lib/bar.ts" },
        ],
      },
      { dead: ["lib/bar.ts"], singleOwner: [], globs: [], edges: [] },
    );
    assert.deepEqual(ids(result.stale), ["dead:lib/bar.ts"]);
    assert.deepEqual(result.newViolations, []);
  });

  it("fails a feature imported by another feature", () => {
    const result = checkPlacement(
      {
        files: ["app/x/page.tsx", "features/a/compose.ts", "features/b/ui/view.tsx"],
        edges: [
          { from: "app/x/page.tsx", to: "features/b/ui/view.tsx" },
          { from: "features/b/ui/view.tsx", to: "features/a/compose.ts" },
        ],
      },
      { dead: [], singleOwner: [], globs: [], edges: [] },
    );
    assert.deepEqual(ids(result.newViolations), [
      "cross-feature:features/b/ui/view.tsx->features/a/compose.ts",
    ]);
  });

  it("passes a docs feature imported from prose/guides MDX", () => {
    const result = checkPlacement(
      {
        files: [
          "prose/guides/maturity-and-compatibility.mdx",
          "features/docs/guides/maturity-and-compatibility/ui/view.tsx",
        ],
        edges: [
          {
            from: "prose/guides/maturity-and-compatibility.mdx",
            to: "features/docs/guides/maturity-and-compatibility/ui/view.tsx",
          },
        ],
      },
      { dead: [], singleOwner: [], globs: [], edges: [] },
    );
    assert.deepEqual(result.newViolations, []);
  });

  it("fails a reviews feature imported from prose/guides MDX", () => {
    const result = checkPlacement(
      {
        files: ["prose/guides/x.mdx", "features/reviews/ui/view.tsx"],
        edges: [{ from: "prose/guides/x.mdx", to: "features/reviews/ui/view.tsx" }],
      },
      { dead: [], singleOwner: [], globs: [], edges: [] },
    );
    assert.deepEqual(ids(result.newViolations), [
      "cross-feature:prose/guides/x.mdx->features/reviews/ui/view.tsx",
    ]);
  });

  it("passes a docs feature imported from mdx-components.tsx", () => {
    const result = checkPlacement(
      {
        files: ["mdx-components.tsx", "features/docs/mdx/ui/agent-name.tsx"],
        edges: [{ from: "mdx-components.tsx", to: "features/docs/mdx/ui/agent-name.tsx" }],
      },
      { dead: [], singleOwner: [], globs: [], edges: [] },
    );
    assert.deepEqual(result.newViolations, []);
  });

  it("fails a reviews feature imported from mdx-components.tsx", () => {
    const result = checkPlacement(
      {
        files: ["mdx-components.tsx", "features/reviews/ui/view.tsx"],
        edges: [{ from: "mdx-components.tsx", to: "features/reviews/ui/view.tsx" }],
      },
      { dead: [], singleOwner: [], globs: [], edges: [] },
    );
    assert.deepEqual(ids(result.newViolations), [
      "cross-feature:mdx-components.tsx->features/reviews/ui/view.tsx",
    ]);
  });

  it("does not treat prose/guides → features/docs as required debt", () => {
    assert.equal(
      REQUIRED_EDGES.filter(
        (edge) => edge.from.startsWith("prose/guides/") && edge.to.startsWith("features/docs/"),
      ).length,
      0,
    );
  });

  it("passes a feature imported only by a route file", () => {
    const result = checkPlacement(
      {
        files: ["app/x/page.tsx", "features/a/compose.ts"],
        edges: [{ from: "app/x/page.tsx", to: "features/a/compose.ts" }],
      },
      { dead: [], singleOwner: [], globs: [], edges: [] },
    );
    assert.deepEqual(result.newViolations, []);
  });

  it("passes a feature imported from a route private folder", () => {
    const result = checkPlacement(
      {
        files: ["app/x/page.tsx", "app/x/_screen/view.tsx", "features/a/compose.ts"],
        edges: [
          { from: "app/x/page.tsx", to: "app/x/_screen/view.tsx" },
          { from: "app/x/_screen/view.tsx", to: "features/a/compose.ts" },
        ],
      },
      { dead: [], singleOwner: [], globs: [], edges: [] },
    );
    assert.deepEqual(result.newViolations, []);
  });

  it("fails a private folder imported from another route", () => {
    const result = checkPlacement(
      {
        files: ["app/x/page.tsx", "app/y/page.tsx", "app/x/_screen/view.tsx"],
        edges: [{ from: "app/y/page.tsx", to: "app/x/_screen/view.tsx" }],
      },
      { dead: [], singleOwner: [], globs: [], edges: [] },
    );
    assert.deepEqual(ids(result.newViolations), [
      "private-leak:app/y/page.tsx->app/x/_screen/view.tsx",
    ]);
  });

  it("passes a private folder imported from its own route", () => {
    const result = checkPlacement(
      {
        files: ["app/x/page.tsx", "app/x/_screen/view.tsx"],
        edges: [{ from: "app/x/page.tsx", to: "app/x/_screen/view.tsx" }],
      },
      { dead: [], singleOwner: [], globs: [], edges: [] },
    );
    assert.deepEqual(result.newViolations, []);
  });

  it("absorbs a new single-owner file under a directory glob", () => {
    const result = checkPlacement(
      {
        files: ["app/x/page.tsx", "components/foo/new.tsx"],
        edges: [{ from: "app/x/page.tsx", to: "components/foo/new.tsx" }],
      },
      { dead: [], singleOwner: [], globs: ["components/foo/**"], edges: [] },
    );
    assert.deepEqual(result.newViolations, []);
    assert.deepEqual(result.stale, []);
  });

  it("fails a directory glob that matches no remaining violation", () => {
    const result = checkPlacement(
      {
        files: ["app/x/page.tsx", "app/y/page.tsx", "components/foo.ts"],
        edges: [
          { from: "app/x/page.tsx", to: "components/foo.ts" },
          { from: "app/y/page.tsx", to: "components/foo.ts" },
        ],
      },
      { dead: [], singleOwner: [], globs: ["ui/home/**"], edges: [] },
    );
    assert.deepEqual(ids(result.stale), ["glob:ui/home/**"]);
  });
});

describe("live docs tree", () => {
  it("matches the committed baseline (no new, no stale)", () => {
    const graph = buildDocsGraph(docsRoot);
    const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
    for (const glob of REQUIRED_GLOBS) {
      assert.ok(baseline.globs.includes(glob), `baseline missing glob ${glob}`);
    }
    for (const edge of REQUIRED_EDGES) {
      assert.ok(
        baseline.edges.some((e) => e.from === edge.from && e.to === edge.to),
        `baseline missing edge ${edge.from} -> ${edge.to}`,
      );
    }
    const result = checkPlacement(graph, baseline);
    const hint =
      "See apps/docs/AGENTS.md File placement; baseline apps/docs/scripts/module-placement.baseline.json. Move the file; never extend the baseline.";
    assert.deepEqual(ids(result.newViolations), [], `new: ${ids(result.newViolations).join("\n")}\n${hint}`);
    assert.deepEqual(ids(result.stale), [], `stale: ${ids(result.stale).join("\n")}\n${hint}`);
  });

  it("imports catch-all docs chrome from _docs and search from the docs feature", () => {
    const page = readFileSync(join(docsRoot, "app/docs/[[...slug]]/page.tsx"), "utf8");
    const layout = readFileSync(join(docsRoot, "app/docs/[[...slug]]/layout.tsx"), "utf8");
    const main = join(docsRoot, "app/docs/[[...slug]]/_docs/docs-main-content.tsx");
    assert.match(page, /from "\.\/_docs\/docs-main-content"/);
    assert.match(layout, /from "\.\/_docs\/docs-layout-tree\.mjs"/);
    assert.doesNotMatch(page, /from "@\/ui\/docs-main-content"/);
    assert.doesNotMatch(layout, /from "@\/lib\/docs-layout-tree\.mjs"/);
    assert.ok(existsSync(main));
    assert.match(readFileSync(main, "utf8"), /id="main-content"/);
    const provider = readFileSync(join(docsRoot, "app/provider.tsx"), "utf8");
    assert.match(provider, /import\("@\/features\/docs\/ui\/search"\)/);
    assert.doesNotMatch(provider, /components\/search/);
    assert.equal(REQUIRED_GLOBS.includes("ui/docs-main-content.tsx"), false);
    assert.equal(REQUIRED_GLOBS.includes("ui/home/**"), false);
    assert.deepEqual(REQUIRED_GLOBS, []);
  });

  it("imports the home view from _home and does not leave a shim at the old path", () => {
    const page = readFileSync(join(docsRoot, "app/(home)/page.tsx"), "utf8");
    assert.match(page, /from "\.\/_home\/home-view"/);
    assert.doesNotMatch(page, /from "@\/ui\/home\/home-view"/);
    const view = join(docsRoot, "app/(home)/_home/home-view.tsx");
    const composer = join(docsRoot, "app/(home)/_home/home-below-hero.tsx");
    assert.ok(existsSync(view));
    assert.ok(existsSync(composer));
    const viewSrc = readFileSync(view, "utf8");
    assert.match(viewSrc, /from ["']\.\/home-below-hero["']/);
    assert.match(viewSrc, /from ["']\.\/home-hero["']/);
    assert.match(viewSrc, /from ["']\.\/home-rhythm["']/);
    assert.doesNotMatch(viewSrc, /from ["']@\/ui\/home\//);
    assert.equal(existsSync(join(docsRoot, "ui/home/home-view.tsx")), false);
    assert.equal(existsSync(join(docsRoot, "ui/home/home-below-hero.tsx")), false);
    assert.equal(REQUIRED_GLOBS.includes("ui/home/**"), false);
  });

  it("imports home band sections from _home/sections and does not leave shims at the old paths", () => {
    const composer = readFileSync(
      join(docsRoot, "app/(home)/_home/home-below-hero.tsx"),
      "utf8",
    );
    const bands = [
      "home-same-idea-section.tsx",
      "home-six-sentences-section.tsx",
      "home-paste-section.tsx",
      "home-identities-section.tsx",
      "home-limits-section.tsx",
      "home-manifesto-section.tsx",
      "home-closing-section.tsx",
      "home-link.tsx",
    ];
    for (const name of bands) {
      assert.ok(existsSync(join(docsRoot, "app/(home)/_home/sections", name)), name);
      assert.equal(existsSync(join(docsRoot, "ui/home", name)), false, `shim ${name}`);
    }
    for (const name of bands.filter((file) => file.endsWith("-section.tsx"))) {
      const stem = name.replace(/\.tsx$/, "");
      assert.match(composer, new RegExp(`from ["']\\./sections/${stem}["']`));
    }
    assert.doesNotMatch(composer, /from ["']@\/ui\/home\/home-\w+-section["']/);
    const sameIdea = readFileSync(
      join(docsRoot, "app/(home)/_home/sections/home-same-idea-section.tsx"),
      "utf8",
    );
    assert.match(sameIdea, /from ["']\.\/home-link["']/);
    assert.doesNotMatch(sameIdea, /from "@\/ui\/home\/home-link"/);
    assert.match(sameIdea, /from ["']\.\.\/home-rhythm["']/);
    const identities = readFileSync(
      join(docsRoot, "app/(home)/_home/sections/home-identities-section.tsx"),
      "utf8",
    );
    assert.match(identities, /from ["']\.\.\/home-identity-looks["']/);
    assert.doesNotMatch(identities, /from ["']@\/ui\/home\/home-identity-looks["']/);
    const closing = readFileSync(
      join(docsRoot, "app/(home)/_home/sections/home-closing-section.tsx"),
      "utf8",
    );
    assert.match(closing, /from ["']\.\.\/home-copy-command-field["']/);
    assert.equal(REQUIRED_GLOBS.includes("ui/home/**"), false);
  });

  it("imports identity-looks from _home and does not leave shims at the old paths", () => {
    const cluster = [
      "home-identity-looks.tsx",
      "home-identity-looks-tabs.tsx",
      "home-identity-example-mist.tsx",
      "home-identity-example-mist-controls.tsx",
      "home-identity-facts.ts",
      "use-look-fade.ts",
    ];
    for (const name of cluster) {
      assert.ok(existsSync(join(docsRoot, "app/(home)/_home", name)), name);
      assert.equal(existsSync(join(docsRoot, "ui/home", name)), false, `shim ${name}`);
    }
    const copies = ["home-identity-looks-copy.ts", "home-identity-examples-copy.ts"];
    for (const name of copies) {
      assert.ok(existsSync(join(docsRoot, "app/(home)/_home/i18n", name)), name);
      assert.equal(existsSync(join(docsRoot, "ui/home", name)), false, `shim ${name}`);
    }
    const looks = readFileSync(join(docsRoot, "app/(home)/_home/home-identity-looks.tsx"), "utf8");
    assert.match(looks, /from ["']\.\/home-rhythm["']/);
    assert.match(looks, /useMotionPreference\(\) === ["']no-preference["']/);
    assert.doesNotMatch(looks, /use-motion-ok|useMotionOk/);
    assert.match(looks, /from ["']\.\/home-identity-facts["']/);
    assert.match(looks, /from ["']\.\/i18n\/home-identity-looks-copy["']/);
    assert.match(looks, /from ["']\.\/use-look-fade["']/);
    assert.doesNotMatch(looks, /from ["']@\/ui\/home\/home-identity/);
    assert.doesNotMatch(looks, /from ["']@\/ui\/home\/use-look-fade["']/);
    const identities = readFileSync(
      join(docsRoot, "app/(home)/_home/sections/home-identities-section.tsx"),
      "utf8",
    );
    assert.match(identities, /from ["']\.\.\/home-identity-looks["']/);
    assert.match(identities, /from ["']\.\.\/home-rhythm["']/);
    assert.equal(REQUIRED_GLOBS.includes("ui/home/**"), false);
  });

  it("imports band copy catalogs from _home/i18n and does not leave shims at the old paths", () => {
    const copies = [
      "home-same-idea-copy.ts",
      "home-six-sentences-copy.ts",
      "home-paste-copy.ts",
      "home-limits-copy.ts",
      "home-manifesto-copy.ts",
      "home-closing-copy.ts",
    ];
    for (const name of copies) {
      assert.ok(existsSync(join(docsRoot, "app/(home)/_home/i18n", name)), name);
      assert.equal(existsSync(join(docsRoot, "ui/home/i18n", name)), false, `shim ${name}`);
    }
    assert.ok(existsSync(join(docsRoot, "app/(home)/_home/i18n/home-hero-copy.ts")));
    assert.ok(existsSync(join(docsRoot, "app/(home)/_home/i18n/home-copy-command-copy.ts")));
    assert.equal(existsSync(join(docsRoot, "ui/home/i18n/home-hero-copy.ts")), false);
    assert.equal(existsSync(join(docsRoot, "ui/home/i18n/home-copy-command-copy.ts")), false);
    const sectionsDir = join(docsRoot, "app/(home)/_home/sections");
    const sectionFiles = [
      "home-same-idea-section.tsx",
      "home-six-sentences-section.tsx",
      "home-paste-section.tsx",
      "home-limits-section.tsx",
      "home-manifesto-section.tsx",
      "home-closing-section.tsx",
    ];
    for (const name of sectionFiles) {
      const src = readFileSync(join(sectionsDir, name), "utf8");
      assert.doesNotMatch(src, /from ["']@\/ui\/home\/i18n\//, name);
      assert.match(src, /from ["']\.\.\/i18n\//, name);
    }
    const closing = readFileSync(join(sectionsDir, "home-closing-section.tsx"), "utf8");
    assert.match(closing, /from ["']\.\.\/home-copy-command-field["']/);
    assert.equal(REQUIRED_GLOBS.includes("ui/home/**"), false);
    assert.equal(existsSync(join(docsRoot, "ui/home")), false);
  });

  it("does not leave shims at the old docs layout and search paths", () => {
    assert.equal(existsSync(join(docsRoot, "ui/docs-main-content.tsx")), false);
    assert.equal(existsSync(join(docsRoot, "lib/docs-layout-tree.mjs")), false);
    assert.equal(existsSync(join(docsRoot, "lib/ui-sidebar-nav.mjs")), false);
    assert.equal(existsSync(join(docsRoot, "lib/docs-search-ranking.mjs")), false);
    assert.equal(existsSync(join(docsRoot, "lib/use-docs-static-search.ts")), false);
    assert.equal(existsSync(join(docsRoot, "components/search.tsx")), false);
  });

  it("imports MDX tags from features/docs and keeps MdxPre in components", () => {
    const mdx = readFileSync(join(docsRoot, "mdx-components.tsx"), "utf8");
    assert.match(mdx, /from "@\/features\/docs\/mdx\/ui\/agent-name"/);
    assert.match(mdx, /from "@\/features\/docs\/mdx\/ui\/docs-area-label"/);
    assert.match(mdx, /from "@\/features\/docs\/mdx\/ui\/docs-prose-table"/);
    assert.match(mdx, /from "@\/features\/docs\/mdx\/ui\/docs-kit-name-list"/);
    assert.match(mdx, /from "@\/features\/docs\/mdx\/ui\/ai-setup-prompt"/);
    assert.match(mdx, /from "@\/features\/docs\/mdx\/ui\/setup-entry-prompt"/);
    assert.match(mdx, /from "@\/features\/docs\/mdx\/ui\/ai-setup-page-title"/);
    assert.match(mdx, /from "@\/components\/mdx-pre"/);
    assert.doesNotMatch(mdx, /from "@\/components\/(?:agent-name|docs-area-label|docs-prose-table|docs-kit-name-list|ai-setup-prompt|setup-entry-prompt|ai-setup-page-title)"/);
  });

  it("imports the maturity guide view from features/docs", () => {
    const mdx = readFileSync(join(docsRoot, "prose/guides/maturity-and-compatibility.mdx"), "utf8");
    assert.match(
      mdx,
      /from "@\/features\/docs\/guides\/maturity-and-compatibility\/ui\/maturity-compatibility-view"/,
    );
    assert.doesNotMatch(mdx, /from "@\/components\/maturity-compatibility-view"/);
  });

  it("imports use-package-manager from features/docs", () => {
    const blocks = readFileSync(join(docsRoot, "features/docs/ui/adoption-blocks.tsx"), "utf8");
    const panel = readFileSync(join(docsRoot, "features/docs/ui/adoption-panel.tsx"), "utf8");
    assert.match(blocks, /from "\.\/use-package-manager"/);
    assert.match(panel, /from "\.\/use-package-manager"/);
    assert.doesNotMatch(blocks, /from "@\/lib\/use-package-manager"/);
    assert.doesNotMatch(panel, /from "@\/lib\/use-package-manager"/);
  });

  it("keeps the fumadocs package-manager storage key on the docs-feature hook", () => {
    const hook = readFileSync(join(docsRoot, "features/docs/ui/use-package-manager.ts"), "utf8");
    assert.match(hook, /createStoredChoice\("package-manager"/);
    assert.match(hook, /from "@zedtech\/zedkit-ui"/);
    assert.match(hook, /from "@\/lib\/package-manager-commands"/);
  });
});

describe("landTimeBaseline", () => {
  it("writes empty dead, singleOwner, and edges for a two-route shared component", () => {
    assert.deepEqual(
      landTimeBaseline({
        files: ["app/x/page.tsx", "app/y/page.tsx", "components/foo.ts"],
        edges: [
          { from: "app/x/page.tsx", to: "components/foo.ts" },
          { from: "app/y/page.tsx", to: "components/foo.ts" },
        ],
      }),
      { dead: [], singleOwner: [], globs: [], edges: [] },
    );
  });
});

function withTempDocs(files, fn) {
  const dir = mkdtempSync(join(tmpdir(), "placement-"));
  for (const [rel, body] of Object.entries(files)) {
    const abs = join(dir, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, body);
  }
  const value = fn(dir);
  rmSync(dir, { recursive: true, force: true });
  return value;
}

describe("checkDocsBaseline", () => {
  it("passes when an empty baseline matches a clean graph", () => {
    withTempDocs(
      {
        "app/x/page.tsx": 'import "@/components/foo";\n',
        "app/y/page.tsx": 'import "@/components/foo";\n',
        "components/foo.ts": "export const foo = 1;\n",
      },
      (dir) => {
        const baseline = join(dir, "baseline.json");
        writeFileSync(baseline, `${JSON.stringify({ dead: [], singleOwner: [], globs: [], edges: [] }, null, 2)}\n`);
        const result = checkDocsBaseline(dir, baseline);
        assert.deepEqual(result.newViolations, []);
        assert.deepEqual(result.stale, []);
      },
    );
  });

  it("fails when a new dead file appears against an empty baseline", () => {
    withTempDocs(
      {
        "app/x/page.tsx": "export default function Page() {}\n",
        "lib/orphan.ts": "export const x = 1;\n",
      },
      (dir) => {
        const baseline = join(dir, "baseline.json");
        writeFileSync(baseline, `${JSON.stringify({ dead: [], singleOwner: [], globs: [], edges: [] }, null, 2)}\n`);
        const result = checkDocsBaseline(dir, baseline);
        assert.deepEqual(ids(result.newViolations), ["dead:lib/orphan.ts"]);
      },
    );
  });
});

describe("writeLandTimeBaseline", () => {
  it("writes empty arrays when the walk finds no shared-folder violations", () => {
    withTempDocs(
      {
        "app/x/page.tsx": 'import "@/components/foo";\n',
        "app/y/page.tsx": 'import "@/components/foo";\n',
        "components/foo.ts": "export const foo = 1;\n",
      },
      (dir) => {
        const out = join(dir, "baseline.json");
        writeLandTimeBaseline(dir, out);
        assert.deepEqual(JSON.parse(readFileSync(out, "utf8")), {
          dead: [],
          singleOwner: [],
          globs: [],
          edges: [],
        });
      },
    );
  });

  it("still throws when the walk finds more than 200 dead files", () => {
    /** @type {Record<string, string>} */
    const files = { "app/x/page.tsx": "export default function Page() {}\n" };
    for (let i = 0; i < 201; i += 1) files[`lib/dead-${String(i).padStart(3, "0")}.ts`] = "export const x = 1;\n";
    withTempDocs(files, (dir) => {
      assert.throws(
        () => writeLandTimeBaseline(dir, join(dir, "baseline.json")),
        /201 dead files/,
      );
    });
  });
});

describe("baselineGrowth", () => {
  it("refuses a new dead entry after an empty baseline", () => {
    assert.deepEqual(baselineGrowth({ dead: [], singleOwner: [], globs: [], edges: [] }, { dead: ["lib/a.ts"] }), [
      "dead:lib/a.ts",
    ]);
  });

  it("refuses new dead, single-owner, glob, and edge entries", () => {
    assert.deepEqual(
      baselineGrowth(
        { dead: ["lib/a.ts"], singleOwner: [], globs: ["ui/home/**"], edges: [] },
        {
          dead: ["lib/a.ts", "lib/b.ts"],
          singleOwner: ["lib/c.ts"],
          globs: ["ui/home/**", "ui/new/**"],
          edges: [{ from: "features/a/x.ts", to: "features/b/y.ts" }],
        },
      ),
      ["dead:lib/b.ts", "single-owner:lib/c.ts", "glob:ui/new/**", "edge:features/a/x.ts->features/b/y.ts"],
    );
  });

  it("allows shrink", () => {
    assert.deepEqual(
      baselineGrowth(
        {
          dead: ["lib/a.ts", "lib/b.ts"],
          singleOwner: ["lib/c.ts"],
          globs: ["ui/home/**"],
          edges: [{ from: "features/a/x.ts", to: "features/b/y.ts" }],
        },
        { dead: ["lib/a.ts"], singleOwner: [], globs: ["ui/home/**"], edges: [] },
      ),
      [],
    );
  });
});

describe("ESLint one-way imports", () => {
  /** @type {ESLint | undefined} */
  let eslint;

  async function lintText(filePath, code) {
    eslint ??= new ESLint({ cwd: repoRoot });
    const [result] = await eslint.lintText(code, { filePath });
    return result?.messages ?? [];
  }

  it("declares the eslint import used by this file", () => {
    const pkg = JSON.parse(readFileSync(join(docsRoot, "package.json"), "utf8"));
    assert.ok(pkg.devDependencies?.eslint, "apps/docs must declare eslint (knip unlisted-dep)");
  });

  it("fails a new lib file importing @/components/", async () => {
    const messages = await lintText(
      join(repoRoot, "apps/docs/lib/placement-probe.ts"),
      'import { x } from "@/components/maturity-badge";\n',
    );
    assert.ok(
      messages.some((m) => m.ruleId === "no-restricted-imports" && /lib may not import/i.test(m.message)),
      messages.map((m) => `${m.ruleId}: ${m.message}`).join("\n"),
    );
  });

  it("fails a new lib file importing ../components/", async () => {
    const messages = await lintText(
      join(repoRoot, "apps/docs/lib/placement-probe.ts"),
      'import { x } from "../components/maturity-badge";\n',
    );
    assert.ok(
      messages.some((m) => m.ruleId === "no-restricted-imports" && /lib may not import/i.test(m.message)),
      messages.map((m) => `${m.ruleId}: ${m.message}`).join("\n"),
    );
  });

  it("fails a new components file importing @/features/", async () => {
    const messages = await lintText(
      join(repoRoot, "apps/docs/components/placement-probe.tsx"),
      'import { x } from "@/features/reviews/compose";\n',
    );
    assert.ok(
      messages.some((m) => m.ruleId === "no-restricted-imports" && /may not import app or features/i.test(m.message)),
      messages.map((m) => `${m.ruleId}: ${m.message}`).join("\n"),
    );
  });

  it("fails a new components file importing ../app/", async () => {
    const messages = await lintText(
      join(repoRoot, "apps/docs/components/placement-probe.tsx"),
      'import { x } from "../app/layout";\n',
    );
    assert.ok(
      messages.some((m) => m.ruleId === "no-restricted-imports" && /may not import app or features/i.test(m.message)),
      messages.map((m) => `${m.ruleId}: ${m.message}`).join("\n"),
    );
  });

  it("fails a nested feature file importing ../../../app/", async () => {
    const messages = await lintText(
      join(repoRoot, "apps/docs/features/reviews/ui/placement-probe.tsx"),
      'import { x } from "../../../app/layout";\n',
    );
    assert.ok(
      messages.some((m) => m.ruleId === "no-restricted-imports" && /feature may not import app/i.test(m.message)),
      messages.map((m) => `${m.ruleId}: ${m.message}`).join("\n"),
    );
  });

  it("fails a new lib file importing a multi-segment # subpath", async () => {
    const messages = await lintText(
      join(repoRoot, "apps/docs/lib/placement-probe.ts"),
      'import { x } from "#docs/layout";\n',
    );
    assert.ok(
      messages.some((m) => m.ruleId === "no-restricted-imports" && /may not import app or features/i.test(m.message)),
      messages.map((m) => `${m.ruleId}: ${m.message}`).join("\n"),
    );
  });

  it("fails a feature file importing @/app/", async () => {
    const messages = await lintText(
      join(repoRoot, "apps/docs/features/reviews/ui/placement-probe.tsx"),
      'import { x } from "@/app/layout";\n',
    );
    assert.ok(
      messages.some((m) => m.ruleId === "no-restricted-imports" && /feature may not import app/i.test(m.message)),
      messages.map((m) => `${m.ruleId}: ${m.message}`).join("\n"),
    );
  });

  it("fails a feature compose file importing @/app/", async () => {
    const messages = await lintText(
      join(repoRoot, "apps/docs/features/reviews/compose.ts"),
      'import { x } from "@/app/layout";\n',
    );
    assert.ok(
      messages.some((m) => m.ruleId === "no-restricted-imports" && /feature may not import app/i.test(m.message)),
      messages.map((m) => `${m.ruleId}: ${m.message}`).join("\n"),
    );
  });

  it("needs no L8 exception after component-page-toc moves next to the page", async () => {
    eslint ??= new ESLint({ cwd: repoRoot });
    const [result] = await eslint.lintFiles(["apps/docs/features/docs/component-page-toc.ts"]);
    assert.equal(
      (result?.messages ?? []).filter((m) => m.ruleId === "no-restricted-imports").length,
      0,
      result?.messages?.map((m) => `${m.ruleId}: ${m.message}`).join("\n"),
    );
  });

  it("needs no L5 exception on app/(home)/_home/home-hero.tsx", async () => {
    eslint ??= new ESLint({ cwd: repoRoot });
    const [result] = await eslint.lintFiles(["apps/docs/app/(home)/_home/home-hero.tsx"]);
    assert.equal(
      (result?.messages ?? []).filter((m) => m.ruleId === "no-restricted-imports").length,
      0,
      result?.messages?.map((m) => `${m.ruleId}: ${m.message}`).join("\n"),
    );
    const eslintConfig = readFileSync(join(repoRoot, "eslint.config.mjs"), "utf8");
    assert.doesNotMatch(eslintConfig, /docs\/one-way-exception-l5-home-hero/);
    assert.doesNotMatch(eslintConfig, /docs\/one-way-exception/);
  });

  it("runs placement --check from the docs lint script", () => {
    const pkg = JSON.parse(readFileSync(join(docsRoot, "package.json"), "utf8"));
    assert.match(pkg.scripts.lint, /node scripts\/module-placement\.mjs --check/);
  });

  it("keeps hexagonal feature-folder bans on note-list ui", async () => {
    const messages = await lintText(
      join(repoRoot, "apps/docs/features/note-list/ui/placement-probe.tsx"),
      'import { x } from "../adapters/fixture";\n',
    );
    assert.ok(
      messages.some((m) => m.ruleId === "no-restricted-imports" && /ports, not adapters/i.test(m.message)),
      messages.map((m) => `${m.ruleId}: ${m.message}`).join("\n"),
    );
  });
});
