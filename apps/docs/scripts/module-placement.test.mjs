import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import {
  REQUIRED_EDGES,
  REQUIRED_GLOBS,
  baselineGrowth,
  buildDocsGraph,
  checkPlacement,
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
        files: ["app/x/page.tsx", "ui/home/new.tsx"],
        edges: [{ from: "app/x/page.tsx", to: "ui/home/new.tsx" }],
      },
      { dead: [], singleOwner: [], globs: ["ui/home/**"], edges: [] },
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
    assert.ok(
      baseline.dead.includes("lib/review-appearance.ts") ||
        baseline.singleOwner.includes("lib/review-appearance.ts"),
      "baseline missing lib/review-appearance.ts",
    );
    const result = checkPlacement(graph, baseline);
    const hint =
      "See apps/docs/AGENTS.md File placement; baseline apps/docs/scripts/module-placement.baseline.json. Move the file; never extend the baseline.";
    assert.deepEqual(ids(result.newViolations), [], `new: ${ids(result.newViolations).join("\n")}\n${hint}`);
    assert.deepEqual(ids(result.stale), [], `stale: ${ids(result.stale).join("\n")}\n${hint}`);
  });

  it("imports catch-all docs chrome from _docs and search from the docs feature", () => {
    const page = readFileSync(join(docsRoot, "app/docs/[[...slug]]/page.tsx"), "utf8");
    assert.match(page, /from "\.\/_docs\/docs-main-content"/);
    const layout = readFileSync(join(docsRoot, "app/docs/[[...slug]]/layout.tsx"), "utf8");
    assert.match(layout, /from "\.\/_docs\/docs-layout-tree\.mjs"/);
    const provider = readFileSync(join(docsRoot, "app/provider.tsx"), "utf8");
    assert.match(provider, /import\("@\/features\/docs\/ui\/search"\)/);
    assert.doesNotMatch(provider, /components\/search/);
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
    assert.match(blocks, /from "\.\.\/use-package-manager"/);
    assert.match(panel, /from "\.\.\/use-package-manager"/);
    assert.doesNotMatch(blocks, /from "@\/lib\/use-package-manager"/);
    assert.doesNotMatch(panel, /from "@\/lib\/use-package-manager"/);
  });

  it("keeps the fumadocs package-manager storage key on the docs-feature hook", () => {
    const hook = readFileSync(join(docsRoot, "features/docs/use-package-manager.ts"), "utf8");
    assert.match(hook, /createStoredChoice\("package-manager"/);
    assert.match(hook, /from "@\/lib\/use-stored-choice"/);
    assert.match(hook, /from "@\/lib\/package-manager-commands"/);
  });
});

describe("baselineGrowth", () => {
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

  it("fails a nested ui file importing ../../app/", async () => {
    const messages = await lintText(
      join(repoRoot, "apps/docs/ui/home/placement-probe.tsx"),
      'import { x } from "../../app/layout";\n',
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

  it("keeps the L5 exception on ui/home/home-hero.tsx", async () => {
    eslint ??= new ESLint({ cwd: repoRoot });
    const [result] = await eslint.lintFiles(["apps/docs/ui/home/home-hero.tsx"]);
    assert.equal(
      (result?.messages ?? []).filter((m) => m.ruleId === "no-restricted-imports").length,
      0,
      result?.messages?.map((m) => `${m.ruleId}: ${m.message}`).join("\n"),
    );
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
