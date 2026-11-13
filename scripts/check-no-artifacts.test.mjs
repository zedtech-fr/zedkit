import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const script = join(root, "scripts/check-no-artifacts.sh");

const gitEnv = {
  ...process.env,
  GIT_AUTHOR_NAME: "t",
  GIT_AUTHOR_EMAIL: "t@example.com",
  GIT_COMMITTER_NAME: "t",
  GIT_COMMITTER_EMAIL: "t@example.com",
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: "/dev/null",
};

function gitRepo(files = {}, { forceAdd = [] } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "artifacts-"));
  execFileSync("git", ["init", "-q"], { cwd: dir, env: gitEnv });
  execFileSync("git", ["config", "user.name", "t"], { cwd: dir, env: gitEnv });
  execFileSync("git", ["config", "user.email", "t@example.com"], { cwd: dir, env: gitEnv });
  execFileSync("git", ["config", "commit.gpgsign", "false"], { cwd: dir, env: gitEnv });
  execFileSync("git", ["config", "core.excludesFile", "/dev/null"], { cwd: dir, env: gitEnv });
  for (const [rel, body] of Object.entries(files)) {
    const path = join(dir, rel);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, body);
  }
  execFileSync("git", ["add", "-A"], { cwd: dir, env: gitEnv });
  if (forceAdd.length > 0) {
    execFileSync("git", ["add", "-f", ...forceAdd], { cwd: dir, env: gitEnv });
  }
  execFileSync("git", ["commit", "-qm", "init"], { cwd: dir, env: gitEnv });
  return dir;
}

function runCheck(cwd) {
  return spawnSync("bash", [script], { cwd, encoding: "utf8", env: gitEnv });
}

describe("check-no-artifacts evidence PNGs", () => {
  it("this repo does not track evidence PNGs and keeps capture-config JSON", () => {
    const tracked = execFileSync("git", ["ls-files", "--", "apps/docs/tests/evidence"], {
      cwd: root,
      encoding: "utf8",
    })
      .trim()
      .split("\n")
      .filter(Boolean);
    assert.deepEqual(
      tracked.filter((f) => f.endsWith(".png")),
      [],
    );
    assert.ok(
      tracked.includes("apps/docs/tests/evidence/issues/critical-states.json"),
      "critical-states.json must stay tracked",
    );
  });

  it("gitignore ignores evidence PNGs and keeps critical-states.json", () => {
    const ignoredPng = spawnSync(
      "git",
      ["check-ignore", "--no-index", "apps/docs/tests/evidence/issues/shot.png"],
      { cwd: root, encoding: "utf8" },
    );
    assert.equal(ignoredPng.status, 0, ignoredPng.stdout + ignoredPng.stderr);
    const ignoredRootPng = spawnSync(
      "git",
      ["check-ignore", "--no-index", "apps/docs/tests/evidence/volt-lead-volt-light.png"],
      { cwd: root, encoding: "utf8" },
    );
    assert.equal(ignoredRootPng.status, 0, ignoredRootPng.stdout + ignoredRootPng.stderr);
    const json = spawnSync(
      "git",
      ["check-ignore", "--no-index", "apps/docs/tests/evidence/issues/critical-states.json"],
      { cwd: root, encoding: "utf8" },
    );
    assert.notEqual(json.status, 0, "critical-states.json must not match .gitignore");
  });

  it("fails when a generated evidence PNG is tracked", () => {
    const dir = gitRepo({
      "apps/docs/tests/evidence/issues/shot.png": "png\n",
    });
    const result = runCheck(dir);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /apps\/docs\/tests\/evidence\/issues\/shot\.png/);
  });

  it("fails when an ignored evidence PNG is force-added", () => {
    const dir = gitRepo(
      {
        ".gitignore": "apps/docs/tests/evidence/**/*.png\n",
        "README.md": "ok\n",
        "apps/docs/tests/evidence/issues/shot.png": "png\n",
      },
      { forceAdd: ["apps/docs/tests/evidence/issues/shot.png"] },
    );
    const result = runCheck(dir);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /apps\/docs\/tests\/evidence\/issues\/shot\.png/);
  });

  it("passes when only capture-config JSON is tracked under tests/evidence", () => {
    const dir = gitRepo({
      "README.md": "ok\n",
      "apps/docs/tests/evidence/issues/critical-states.json": "[]\n",
    });
    const result = runCheck(dir);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /check-no-artifacts: ok/);
  });
});
