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
});

const NODEPLOY_GLOBS = [
  "scripts/*.test.mjs",
  "scripts/registry/*.test.mjs",
  "apps/docs/scripts/*.test.mjs",
  "packages/ai/scripts/*.test.mjs",
];
const DEPLOY_GLOBS = ["deploy/*.test.mjs", "deploy/suggest/*.test.mjs"];
const VITEST_NODE_TEST_ELSEWHERE = new Set([
  "packages/devtools/tests/enabled.test.mjs",
  ...globSync("packages/quality/tests/unit/*.test.mjs", { cwd: root }),
]);

describe("test:registry globs", () => {
  it("covers every tracked *.test.mjs outside vitest packages and deploy", () => {
    const tracked = execSync("git ls-files '*.test.mjs'", { cwd: root, encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean);
    const covered = new Set(
      [...NODEPLOY_GLOBS, ...DEPLOY_GLOBS].flatMap((pattern) =>
        globSync(pattern, { cwd: root }),
      ),
    );
    const missing = tracked.filter(
      (f) => !VITEST_NODE_TEST_ELSEWHERE.has(f) && !covered.has(f),
    );
    assert.deepEqual(missing, [], `unmatched registry tests: ${missing.join(", ")}`);
  });

  it("self-hosted checks job runs pnpm test:registry:nodeploy (no inline file list)", () => {
    const checks = workflow.split(/^ {2}checks:/m)[1]?.split(/^ {2}\S/m)[0] ?? "";
    assert.match(checks, /pnpm test:registry:nodeploy/);
    assert.doesNotMatch(checks, /node --test \\\n\s+scripts\/registry/, "inline node --test file list");
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
