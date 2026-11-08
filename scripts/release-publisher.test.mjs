import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  MIN_NODE,
  MIN_NPM,
  PINNED_NPM,
  parseVersion,
  versionGte,
  publisherPath,
  resolvePublisherNpm,
  checkReleasePublisher,
  inspectReleasePublisher,
} from "./release-publisher.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

function fakeBin(dir, name, body = "#!/bin/sh\n") {
  mkdirSync(dir, { recursive: true });
  const path = join(dir, name);
  writeFileSync(path, body);
  chmodSync(path, 0o755);
  return path;
}

describe("release-publisher versions", () => {
  it("parses v-prefixed and bare triples", () => {
    assert.deepEqual(parseVersion("v22.23.4"), [22, 23, 4]);
    assert.deepEqual(parseVersion("11.5.1\n"), [11, 5, 1]);
    assert.equal(parseVersion("not-a-version"), null);
  });

  it("compares triples", () => {
    assert.equal(versionGte([11, 5, 1], [11, 5, 1]), true);
    assert.equal(versionGte([11, 5, 0], [11, 5, 1]), false);
    assert.equal(versionGte([11, 21, 2], [11, 5, 1]), true);
    assert.equal(versionGte([22, 13, 9], [22, 14, 0]), false);
    assert.equal(versionGte([22, 14, 0], [22, 14, 0]), true);
  });

  it("pins an npm 11.x above the OIDC floor", () => {
    const pin = parseVersion(PINNED_NPM);
    const min = parseVersion(MIN_NPM);
    assert.ok(pin);
    assert.ok(min);
    assert.equal(versionGte(pin, min), true);
    assert.equal(pin[0], 11);
    assert.equal(MIN_NODE, "22.14.0");
    assert.equal(MIN_NPM, "11.5.1");
  });
});

describe("release-publisher PATH (pnpm 9.15.9 createEnv)", () => {
  it("orders local .bin, then dirname(execPath), then inherited PATH", () => {
    assert.equal(
      publisherPath({
        execPath: "/opt/hostedtoolcache/node/22.23.4/x64/bin/node",
        cwd: "/tmp/empty-pack",
        pathEnv: "/usr/local/bin:/usr/bin",
        delimiter: ":",
      }),
      "/tmp/empty-pack/node_modules/.bin:/opt/hostedtoolcache/node/22.23.4/x64/bin:/usr/local/bin:/usr/bin",
    );
  });

  it("resolves dirname(execPath) npm even when a later PATH entry is newer", () => {
    const root = mkdtempSync(join(tmpdir(), "release-publisher-"));
    const nodeDir = join(root, "node-prefix", "bin");
    const later = join(root, "usr-local", "bin");
    fakeBin(nodeDir, "npm");
    fakeBin(later, "npm");
    const resolved = resolvePublisherNpm({
      execPath: join(nodeDir, "node"),
      pathEnv: later,
      delimiter: ":",
    });
    assert.equal(resolved, join(nodeDir, "npm"));
  });
});

describe("checkReleasePublisher", () => {
  it("passes Node 22.23.4 + npm 11.5.1 at the Node prefix", () => {
    const result = checkReleasePublisher({
      nodeVersion: "v22.23.4",
      npmVersion: "11.5.1",
      npmPath: "/opt/hostedtoolcache/node/22.23.4/x64/bin/npm",
    });
    assert.equal(result.ok, true);
    assert.deepEqual(result.errors, []);
  });

  it("fails the failing-job combo: Node 22.23.4 + npm 10.9.9", () => {
    const result = checkReleasePublisher({
      nodeVersion: "v22.23.4",
      npmVersion: "10.9.9",
      npmPath: "/opt/hostedtoolcache/node/22.23.4/x64/bin/npm",
    });
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /10\.9\.9/);
    assert.match(result.errors.join("\n"), /11\.5\.1/);
  });

  it("fails npm 11.5.0 (just under the OIDC floor)", () => {
    const result = checkReleasePublisher({
      nodeVersion: "v22.14.0",
      npmVersion: "11.5.0",
      npmPath: "/tmp/npm",
    });
    assert.equal(result.ok, false);
  });

  it("fails Node 22.13.x", () => {
    const result = checkReleasePublisher({
      nodeVersion: "v22.13.1",
      npmVersion: "11.5.1",
      npmPath: "/tmp/npm",
    });
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /22\.14\.0/);
  });

  it("fails when publisher npm is missing", () => {
    const result = checkReleasePublisher({
      nodeVersion: "v22.23.4",
      npmVersion: "",
      npmPath: null,
    });
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /did not resolve npm/);
  });
});

describe("inspectReleasePublisher (real subprocess versions)", () => {
  it("reports the Node-prefix npm 10 even when PATH has npm 11", () => {
    const root = mkdtempSync(join(tmpdir(), "release-publisher-inspect-"));
    const nodeDir = join(root, "node", "bin");
    const later = join(root, "later", "bin");
    fakeBin(nodeDir, "npm", "#!/bin/sh\necho 10.9.9\n");
    fakeBin(later, "npm", "#!/bin/sh\necho 11.21.2\n");
    const fakeNode = join(nodeDir, "node");
    const report = inspectReleasePublisher({
      execPath: fakeNode,
      nodeVersion: "v22.23.4",
      pathEnv: later,
    });
    assert.equal(report.npmPath, join(nodeDir, "npm"));
    assert.equal(report.npmVersion, "10.9.9");
    assert.equal(report.ok, false);
    assert.match(report.errors.join("\n"), /10\.9\.9/);
  });

  it("passes when the Node-prefix npm meets the OIDC floor", () => {
    const root = mkdtempSync(join(tmpdir(), "release-publisher-ok-"));
    const nodeDir = join(root, "node", "bin");
    fakeBin(nodeDir, "npm", "#!/bin/sh\necho 11.21.2\n");
    const report = inspectReleasePublisher({
      execPath: join(nodeDir, "node"),
      nodeVersion: "v22.23.4",
      pathEnv: "/usr/bin",
    });
    assert.equal(report.ok, true);
    assert.equal(report.npmVersion, "11.21.2");
  });
});

describe("release wiring (publisher pin, provenance, optional token)", () => {
  const releaseYml = readFileSync(join(ROOT, ".github/workflows/release.yml"), "utf8");
  const ensureSh = readFileSync(join(ROOT, "scripts/ensure-release-publisher.sh"), "utf8");

  it("release job installs into the Node prefix then asserts before Changesets", () => {
    assert.match(releaseYml, /ensure-release-publisher\.sh/);
    assert.match(ensureSh, /npm install -g --prefix "\$PREFIX"/);
    assert.match(ensureSh, /release-publisher\.mjs/);
    assert.match(ensureSh, /\$\{NODE_BIN\}\/npm/);
    assert.doesNotMatch(ensureSh, /npm install -g npm@/);
    const ensureAt = releaseYml.indexOf("ensure-release-publisher.sh");
    const publishAt = releaseYml.indexOf("changesets/action");
    assert.ok(ensureAt > 0 && publishAt > ensureAt);
  });

  it("keeps OIDC permissions and provenance; does not assign empty NODE_AUTH_TOKEN", () => {
    assert.doesNotMatch(releaseYml, /NODE_AUTH_TOKEN:\s*\$\{\{\s*secrets\.NPM_TOKEN/);
    assert.match(releaseYml, /id-token:\s*write/);
    assert.match(releaseYml, /NPM_CONFIG_PROVENANCE:\s*"true"/);
    assert.match(releaseYml, /registry-url:\s*https:\/\/registry\.npmjs\.org/);
    assert.doesNotMatch(releaseYml, /^\s*environment:/m);
  });

  it("keeps Changesets as the publisher", () => {
    assert.match(releaseYml, /publish-script:\s*pnpm exec changeset publish/);
  });
});
