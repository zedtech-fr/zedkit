import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  selectReleaseAuth,
  githubEnvBody,
  applyGithubEnv,
  pnpmNpmPublishEnv,
  applyReleaseAuth,
} from "./export-release-auth.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SCRIPT = join(ROOT, "scripts/export-release-auth.mjs");
const FIXTURE = "npm_test_token_fixture";

describe("selectReleaseAuth", () => {
  it("uses OIDC when the secret is missing or empty", () => {
    for (const value of [undefined, "", null]) {
      const selection = selectReleaseAuth(value);
      assert.equal(selection.ok, true);
      assert.equal(selection.mode, "oidc");
      assert.equal(selection.nodeAuthToken, null);
    }
  });

  it("uses token when NPM_TOKEN is non-empty", () => {
    const selection = selectReleaseAuth(FIXTURE);
    assert.equal(selection.ok, true);
    assert.equal(selection.mode, "token");
    assert.equal(selection.nodeAuthToken, FIXTURE);
  });

  it("fails closed on a multiline token (GITHUB_ENV injection)", () => {
    const selection = selectReleaseAuth("one\ntwo");
    assert.equal(selection.ok, false);
    assert.match(selection.error, /single line/);
  });
});

describe("Changesets → pnpm 9.15.9 → npm env", () => {
  it("does not put NODE_AUTH_TOKEN on the npm child when the secret is empty", () => {
    const { selection, childEnv } = applyReleaseAuth({ PATH: "/bin" }, "");
    assert.equal(selection.mode, "oidc");
    assert.equal(Object.hasOwn(childEnv, "NODE_AUTH_TOKEN"), false);
    assert.equal(githubEnvBody(selection).includes("NODE_AUTH_TOKEN"), false);
  });

  it("puts NODE_AUTH_TOKEN on the npm child when the secret is set", () => {
    const { selection, childEnv } = applyReleaseAuth({ PATH: "/bin" }, FIXTURE);
    assert.equal(selection.mode, "token");
    const afterGithub = applyGithubEnv({ PATH: "/bin" }, githubEnvBody(selection));
    const pnpmChild = pnpmNpmPublishEnv(afterGithub);
    assert.equal(pnpmChild.NODE_AUTH_TOKEN, FIXTURE);
    assert.equal(childEnv.NODE_AUTH_TOKEN, FIXTURE);
  });

  it("does not leak the token into GITHUB_ENV keys other than NODE_AUTH_TOKEN", () => {
    const body = githubEnvBody(selectReleaseAuth(FIXTURE));
    const lines = body.trim().split("\n");
    assert.deepEqual(
      lines.map((line) => line.slice(0, line.indexOf("="))),
      ["RELEASE_AUTH_MODE", "NODE_AUTH_TOKEN"],
    );
  });
});

describe("CLI (GITHUB_ENV, no secret on stdout)", () => {
  function run(env) {
    const dir = mkdtempSync(join(tmpdir(), "export-release-auth-"));
    const githubEnv = join(dir, "github.env");
    writeFileSync(githubEnv, "");
    const result = spawnSync(process.execPath, [SCRIPT], {
      encoding: "utf8",
      env: { ...env, GITHUB_ENV: githubEnv, PATH: process.env.PATH },
    });
    return { result, githubEnv, written: readFileSync(githubEnv, "utf8") };
  }

  it("writes oidc mode and never NODE_AUTH_TOKEN when NPM_TOKEN is empty", () => {
    const { result, written } = run({ NPM_TOKEN: "" });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /mode=oidc/);
    assert.doesNotMatch(result.stdout + result.stderr, /NODE_AUTH_TOKEN=/);
    assert.match(written, /^RELEASE_AUTH_MODE=oidc$/m);
    assert.doesNotMatch(written, /NODE_AUTH_TOKEN=/);
  });

  it("writes NODE_AUTH_TOKEN to GITHUB_ENV and not to stdout", () => {
    const { result, written } = run({ NPM_TOKEN: FIXTURE });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /mode=token/);
    assert.equal(result.stdout.includes(FIXTURE), false);
    assert.equal(result.stderr.includes(FIXTURE), false);
    assert.match(written, /^RELEASE_AUTH_MODE=token$/m);
    assert.match(written, new RegExp(`^NODE_AUTH_TOKEN=${FIXTURE}$`, "m"));
  });

  it("exits 1 on a multiline token and writes nothing", () => {
    const { result, written } = run({ NPM_TOKEN: "one\ntwo" });
    assert.equal(result.status, 1);
    assert.equal(written, "");
    assert.equal(result.stdout.includes("one\ntwo"), false);
  });
});

describe("release.yml wiring", () => {
  const releaseYml = readFileSync(join(ROOT, ".github/workflows/release.yml"), "utf8");

  it("selects auth after the npm 11 pin and before Changesets", () => {
    const pinAt = releaseYml.indexOf("ensure-release-publisher.sh");
    const authAt = releaseYml.indexOf("export-release-auth.mjs");
    const publishAt = releaseYml.indexOf("changesets/action");
    assert.ok(pinAt > 0 && authAt > pinAt && publishAt > authAt);
  });

  it("does not interpolate secrets.NPM_TOKEN into NODE_AUTH_TOKEN (empty is ENEEDAUTH)", () => {
    assert.doesNotMatch(releaseYml, /NODE_AUTH_TOKEN:\s*\$\{\{\s*secrets\.NPM_TOKEN/);
    assert.match(releaseYml, /NPM_TOKEN:\s*\$\{\{\s*secrets\.NPM_TOKEN/);
  });

  it("keeps OIDC permissions, provenance, npm pin, and no job environment", () => {
    assert.match(releaseYml, /id-token:\s*write/);
    assert.match(releaseYml, /NPM_CONFIG_PROVENANCE:\s*"true"/);
    assert.match(releaseYml, /ensure-release-publisher\.sh/);
    assert.doesNotMatch(releaseYml, /^\s*environment:/m);
  });
});
