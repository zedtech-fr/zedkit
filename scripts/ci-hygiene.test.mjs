import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const workflow = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
// The `hygiene:` job block: from its key to the next two-space job key.
const hygiene = workflow.split(/^ {2}hygiene:/m)[1]?.split(/^ {2}\S/m)[0] ?? "";

describe("ci hygiene job", () => {
  it("no longer invokes check-pr-lenses", () => {
    assert.ok(!workflow.includes("check-pr-lenses"), "ci.yml still references check-pr-lenses");
    assert.ok(!existsSync(join(root, "scripts/check-pr-lenses.sh")), "scripts/check-pr-lenses.sh still exists");
  });

  it("keeps the other hygiene scripts", () => {
    assert.notEqual(hygiene, "", "hygiene job block not found in ci.yml");
    for (const script of [
      "scripts/check-no-artifacts.sh",
      "scripts/check-no-private-refs.sh",
      "scripts/check-tone.sh",
      "scripts/check-breaking-changeset.sh",
      "scripts/check-changeset-packages.sh",
      "scripts/doc-pins.mjs",
    ]) {
      assert.ok(hygiene.includes(script), `hygiene job lost ${script}`);
    }
  });
});

describe("ci-required aggregate", () => {
  it("has no docs-e2e alias job", () => {
    assert.doesNotMatch(workflow, /^ {2}docs-e2e:/m);
    const required = workflow.split(/^ {2}ci-required:/m)[1]?.split(/^ {2}\S/m)[0] ?? "";
    assert.doesNotMatch(required, /docs-e2e/);
    assert.doesNotMatch(required, /DOCS_E2E:/);
  });

  it("needs the registry consumption smokes and passes their results in", () => {
    const required = workflow.split(/^ {2}ci-required:/m)[1]?.split(/^ {2}\S/m)[0] ?? "";
    assert.notEqual(required, "", "ci-required job block not found");
    assert.match(required, /quickstart-smoke/);
    assert.match(required, /adoption-smoke/);
    assert.match(required, /QUICKSTART_SMOKE/);
    assert.match(required, /ADOPTION_SMOKE/);
  });

  it("needs docs-render and passes DOCS_RENDER in", () => {
    const required = workflow.split(/^ {2}ci-required:/m)[1]?.split(/^ {2}\S/m)[0] ?? "";
    assert.notEqual(required, "", "ci-required job block not found");
    assert.match(required, /docs-render/);
    assert.match(required, /DOCS_RENDER/);
  });
});

describe("docs-render job", () => {
  const job = workflow.split(/^ {2}docs-render:/m)[1]?.split(/^ {2}\S/m)[0] ?? "";

  it("reuses docs-out, sets DOCS_ROUTES, and runs e2e:routes", () => {
    assert.notEqual(job, "", "docs-render job block not found");
    assert.match(job, /needs: \[changes, docs-build\]/);
    assert.match(job, /e2e:routes/);
    assert.match(job, /DOCS_ROUTES/);
    assert.match(job, /DOCS_LOOKS/);
    assert.match(job, /--looks/);
    assert.match(job, /docs-render-routes\.mjs/);
    assert.match(job, /playwright install chromium/);
    assert.match(job, /serve@14\.2\.6/);
    assert.ok(job.includes("EVENT: ${{ github.event_name }}"));
    assert.ok(job.includes("BASE_REF: ${{ github.base_ref }}"));
    assert.ok(job.includes("BEFORE: ${{ github.event.before }}"));
    assert.ok(!job.includes('git fetch origin "${{ github.base_ref }}"'));
    assert.match(job, /serve never became ready/);
    assert.match(job, /docs-start\.log/);
    assert.match(job, /docs-render-results/);
    assert.match(job, /if: failure\(\)/);
    assert.match(job, /apps\/docs\/test-results\//);
  });

  it("chooses full vs touched via --mode, HEAD_REF, and a 6/25 timeout", () => {
    assert.notEqual(job, "", "docs-render job block not found");
    assert.match(job, /--mode/);
    assert.ok(job.includes("HEAD_REF: ${{ github.head_ref }}"));
    assert.match(job, /timeout-minutes: \$\{\{[^}]*\b25\b[^}]*\b6\b[^}]*\}\}/);
    assert.match(job, /\[ "\$MODE" = "full" \]/);
    assert.match(job, /unset DOCS_ROUTES/);
    assert.match(job, /unset DOCS_LOOKS/);
  });
});

describe("nightly Chromium sitemap", () => {
  const nightly = readFileSync(join(root, ".github/workflows/nightly-docs-cross-browser.yml"), "utf8");

  it("runs e2e:routes without DOCS_ROUTES on a 25-minute Chromium job", () => {
    const job =
      nightly.split(/^ {2}docs-render-chromium:/m)[1]?.split(/^ {2}\S/m)[0] ?? "";
    assert.notEqual(job, "", "docs-render-chromium job block not found");
    assert.match(job, /timeout-minutes: 25/);
    assert.match(job, /e2e:routes/);
    assert.match(job, /DOCS_E2E_PROJECT: chromium/);
    assert.doesNotMatch(job, /DOCS_ROUTES/);
    assert.doesNotMatch(job, /DOCS_LOOKS/);
    const smoke = nightly.split(/^ {2}docs-smoke-cross-browser:/m)[1]?.split(/^ {2}\S/m)[0] ?? "";
    assert.match(smoke, /firefox/);
    assert.match(smoke, /webkit/);
    assert.doesNotMatch(smoke, /e2e:routes/);
  });
});

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

/** Quoted glob tokens from `node --test "glob" ...` script lines. */
function quotedGlobsFromScript(scriptLine) {
  return [...scriptLine.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

const NODEPLOY_GLOBS = quotedGlobsFromScript(pkg.scripts["test:registry:nodeploy"].replace(/^node --test\s+/, ""));
const DEPLOY_ONLY_GLOBS = quotedGlobsFromScript(
  pkg.scripts["test:registry"].replace(/^pnpm test:registry:nodeploy && node --test\s+/, ""),
);
const REGISTRY_GLOBS = [...NODEPLOY_GLOBS, ...DEPLOY_ONLY_GLOBS];
const VITEST_NODE_TEST_ELSEWHERE = new Set([
  "packages/devtools/tests/enabled.test.mjs",
  "packages/ai/tests/visual-verify.test.mjs",
  ...globSync("packages/quality/tests/unit/*.test.mjs", { cwd: root }),
]);

describe("test:registry globs", () => {
  it("covers every tracked *.test.mjs outside vitest packages and deploy", () => {
    const tracked = execSync("git ls-files '*.test.mjs'", { cwd: root, encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean);
    const covered = new Set(REGISTRY_GLOBS.flatMap((pattern) => globSync(pattern, { cwd: root })));
    const missing = tracked.filter(
      (f) => !VITEST_NODE_TEST_ELSEWHERE.has(f) && !covered.has(f),
    );
    assert.deepEqual(missing, [], `unmatched registry tests: ${missing.join(", ")}`);
  });

  it("self-hosted checks job runs pnpm test:registry:nodeploy (no inline file list)", () => {
    const checks = workflow.split(/^ {2}checks:/m)[1]?.split(/^ {2}\S/m)[0] ?? "";
    assert.match(checks, /pnpm test:registry:nodeploy/);
    const registryStep =
      checks.split(/- name: test:registry \(exclude deploy\/\*\)/m)[1]?.split(/^ {6}- /m)[0] ?? "";
    assert.doesNotMatch(registryStep, /node --test/, "inline node --test file list");
  });

  it("checks job runs pnpm knip", () => {
    const checks = workflow.split(/^ {2}checks:/m)[1]?.split(/^ {2}\S/m)[0] ?? "";
    assert.match(checks, /^\s+- name: knip\n\s+run: pnpm knip$/m);
  });

  it("knip script is exact-pinned (no floating major)", () => {
    assert.match(pkg.scripts.knip, /^pnpm dlx knip@\d+\.\d+\.\d+$/);
  });

  it("registry-deps build includes every dist test:registry imports", () => {
    const checks = workflow.split(/^ {2}checks:/m)[1]?.split(/^ {2}\S/m)[0] ?? "";
    const registryDeps =
      checks.split(/- name: Build \(registry deps\)/m)[1]?.split(/^ {6}- /m)[0] ?? "";
    assert.notEqual(registryDeps, "", "Build (registry deps) step not found");
    for (const pkg of [
      "@zedtech/zedkit-seo",
      "@zedtech/zedkit-ui",
      "@zedtech/zedkit-server",
      "@zedtech/zedkit-live",
    ]) {
      assert.ok(registryDeps.includes(`--filter=${pkg}`), `registry-deps omitted ${pkg}`);
    }
  });
});

function knipJsonc() {
  const text = readFileSync(join(root, "knip.jsonc"), "utf8").replace(/^\s*\/\/.*$/gm, "");
  return JSON.parse(text);
}

function knipIgnoreGlobs(config) {
  /** @type {Array<{ cwd: string, pattern: string }>} */
  const globs = (config.ignore ?? []).map((pattern) => ({ cwd: root, pattern }));
  for (const [workspace, body] of Object.entries(config.workspaces ?? {})) {
    const cwd = workspace === "." ? root : join(root, workspace);
    for (const pattern of body.ignore ?? []) globs.push({ cwd, pattern });
  }
  return globs;
}

describe("knip ignore paths", () => {
  it("every ignore path still matches a tracked file", () => {
    const tracked = new Set(
      execSync("git ls-files", { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean),
    );
    const missing = [];
    for (const { cwd, pattern } of knipIgnoreGlobs(knipJsonc())) {
      const prefix = cwd === root ? "" : `${cwd.slice(root.length + 1).split("\\").join("/")}/`;
      const hits = globSync(pattern, { cwd }).map((file) => `${prefix}${file.split("\\").join("/")}`);
      if (!hits.some((file) => tracked.has(file))) missing.push(pattern);
    }
    assert.deepEqual(missing, [], `knip ignore matches nothing tracked: ${missing.join(", ")}`);
  });
});

describe("pr template", () => {
  it("has no mandatory Lenses/Personas tables", () => {
    const template = readFileSync(join(root, ".github/pull_request_template.md"), "utf8");
    assert.ok(!template.includes("Lenses run"), "template still has a Lenses run table");
    assert.ok(!template.includes("## Personas"), "template still has a Personas section");
    assert.ok(!/at least five/i.test(template), "template still demands five personas");
    assert.match(template, /1[–-]3/, "template does not require 1–3 reviews");
  });
});
