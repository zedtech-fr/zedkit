import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  overridePackages,
  packWorkspacePackages,
  tarballForPackage,
  workspaceInstallClosure,
} from "./workspace-pack-closure.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");

function scratch(t, prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function writePkg(root, folder, pkg) {
  const dir = join(root, "packages", folder);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`);
  return dir;
}

test("workspaceInstallClosure walks runtime workspace deps and skips devDependencies", (t) => {
  const root = scratch(t, "zk-pack-graph-");
  writePkg(root, "a", {
    name: "@t/a",
    version: "1.0.0",
    dependencies: { "@t/b": "workspace:*" },
    devDependencies: { "@t/quality": "workspace:*" },
  });
  writePkg(root, "b", {
    name: "@t/b",
    version: "2.0.0",
    dependencies: { "@t/c": "workspace:*" },
    peerDependencies: { "@t/peer": "workspace:*" },
  });
  writePkg(root, "c", {
    name: "@t/c",
    version: "3.0.0",
    dependencies: { ulid: "1.0.0" },
  });
  writePkg(root, "peer", { name: "@t/peer", version: "4.0.0" });
  writePkg(root, "quality", { name: "@t/quality", version: "5.0.0" });
  writePkg(root, "other", { name: "@t/other", version: "6.0.0" });

  assert.deepEqual(workspaceInstallClosure("@t/a", root), ["@t/a", "@t/b", "@t/c", "@t/peer"]);
  assert.deepEqual(workspaceInstallClosure(["@t/a", "@t/c"], root), ["@t/a", "@t/b", "@t/c", "@t/peer"]);
  assert.throws(() => workspaceInstallClosure("@t/missing", root), /unknown workspace package/);
});

test("workspaceInstallClosure does not loop on a cycle", (t) => {
  const root = scratch(t, "zk-pack-cycle-");
  writePkg(root, "a", { name: "@t/a", version: "1.0.0", dependencies: { "@t/b": "workspace:*" } });
  writePkg(root, "b", { name: "@t/b", version: "1.0.0", dependencies: { "@t/a": "workspace:*" } });
  assert.deepEqual(workspaceInstallClosure("@t/a", root), ["@t/a", "@t/b"]);
});

test("this repo's ui install closure is ui, i18n and core — not quality or consumers", () => {
  const names = workspaceInstallClosure("@zedtech/zedkit-ui", repo);
  assert.deepEqual(names, ["@zedtech/zedkit-core", "@zedtech/zedkit-i18n", "@zedtech/zedkit-ui"]);
  assert.ok(!names.includes("@zedtech/zedkit-quality"));
  assert.ok(!names.includes("@zedtech/zedkit-devtools"));
});

test("tarballForPackage picks the matching tgz among several", (t) => {
  const dest = scratch(t, "zk-pack-tgz-");
  writeFileSync(join(dest, "zedtech-zedkit-ui-0.1.0.tgz"), "ui");
  writeFileSync(join(dest, "zedtech-zedkit-i18n-0.2.2.tgz"), "i18n");
  writeFileSync(join(dest, "zedtech-zedkit-core-1.0.0.tgz"), "core");
  assert.equal(tarballForPackage(dest, "@zedtech/zedkit-i18n"), join(dest, "zedtech-zedkit-i18n-0.2.2.tgz"));
  assert.throws(() => tarballForPackage(dest, "@zedtech/zedkit-seo"), /expected one tarball/);
});

test("overridePackages writes file: specs for the whole closure", (t) => {
  const project = scratch(t, "zk-pack-ov-");
  writeFileSync(join(project, "package.json"), `${JSON.stringify({ name: "consumer", private: true }, null, 2)}\n`);
  overridePackages(project, {
    "@zedtech/zedkit-ui": "/tmp/ui.tgz",
    "@zedtech/zedkit-i18n": "/tmp/i18n.tgz",
    "@zedtech/zedkit-core": "/tmp/core.tgz",
  });
  const pkg = JSON.parse(readFileSync(join(project, "package.json"), "utf8"));
  const yamlPath = join(project, "pnpm-workspace.yaml");
  const yamlText = existsSync(yamlPath) ? readFileSync(yamlPath, "utf8") : "";
  const spec = pkg.pnpm?.overrides?.["@zedtech/zedkit-i18n"] ?? "";
  assert.ok(
    spec === "file:/tmp/i18n.tgz" || yamlText.includes("file:/tmp/i18n.tgz"),
    "i18n must be overridden to the packed tarball",
  );
  assert.ok(
    pkg.pnpm?.overrides?.["@zedtech/zedkit-core"] === "file:/tmp/core.tgz" || yamlText.includes("file:/tmp/core.tgz"),
  );
  assert.ok(
    pkg.pnpm?.overrides?.["@zedtech/zedkit-ui"] === "file:/tmp/ui.tgz" || yamlText.includes("file:/tmp/ui.tgz"),
  );
});

test("quickstart npm path packs the workspace closure", () => {
  const src = readFileSync(join(repo, "scripts/quickstart-smoke.sh"), "utf8");
  assert.match(src, /pack-and-override @zedtech\/zedkit-ui/);
  assert.doesNotMatch(src, /packages\/ui" && pnpm pack/);
});

test("packed ui tarball rewrites workspace deps and the override map covers them", (t) => {
  const dest = scratch(t, "zk-pack-real-");
  const names = workspaceInstallClosure("@zedtech/zedkit-ui", repo);
  const tarballs = packWorkspacePackages(names, dest, repo);
  assert.equal(Object.keys(tarballs).sort().join(" "), names.join(" "));
  const manifest = JSON.parse(execFileSync("tar", ["-xOf", tarballs["@zedtech/zedkit-ui"], "package/package.json"], { encoding: "utf8" }));
  const i18nVersion = JSON.parse(readFileSync(join(repo, "packages/i18n/package.json"), "utf8")).version;
  const coreVersion = JSON.parse(readFileSync(join(repo, "packages/core/package.json"), "utf8")).version;
  assert.equal(manifest.dependencies["@zedtech/zedkit-i18n"], i18nVersion);
  assert.equal(manifest.dependencies["@zedtech/zedkit-core"], coreVersion);
  for (const [name, version] of Object.entries(manifest.dependencies).filter(([dep]) => dep.startsWith("@zedtech/"))) {
    assert.notEqual(version, "workspace:*", name);
    assert.ok(tarballs[name], `packed closure missing ${name}@${version}`);
  }
  assert.equal(tarballs["@zedtech/zedkit-quality"], undefined);
});
