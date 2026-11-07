import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(root, "deploy/publish-dev-static.sh");

function writeExec(file, body) {
  writeFileSync(file, body, { mode: 0o755 });
}

async function withHarness(t) {
  const tmp = await mkdtemp(join(tmpdir(), "publish-dev-static-"));
  const bin = join(tmp, "bin");
  const dest = join(tmp, "remote", "data", "srv", "zedkit");
  const outDir = join(tmp, "out");
  mkdirSync(bin, { recursive: true });
  mkdirSync(dest, { recursive: true });
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), "<!doctype html><title>docs</title>");
  const destJson = JSON.stringify(dest);
  writeExec(
    join(bin, "ssh"),
    `#!/usr/bin/env python3
import subprocess, sys
cmd = sys.argv[2].replace("/data/srv/zedkit", ${destJson})
raise SystemExit(subprocess.call(["bash", "-c", cmd]))
`,
  );
  writeExec(
    join(bin, "rsync"),
    `#!/usr/bin/env python3
import subprocess, sys
dest = ${destJson}
open(${JSON.stringify(join(tmp, "rsync.log"))}, "a", encoding="utf8").write(" ".join(sys.argv[1:]) + "\\n")
mapped = []
for a in sys.argv[1:]:
    if ":" in a and not a.startswith("-"):
        a = a.split(":", 1)[1]
    mapped.append(a.replace("/data/srv/zedkit", dest))
raise SystemExit(subprocess.call(["/usr/bin/rsync", *mapped]))
`,
  );
  writeExec(
    join(bin, "docker"),
    `#!/bin/bash
echo docker-invoked >> ${JSON.stringify(join(tmp, "docker.log"))}
exit 1
`,
  );
  t.after(async () => {
    await rm(tmp, { recursive: true, force: true });
  });
  const run = () =>
    spawnSync("bash", [script, "zed-dev"], {
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        DEPLOY_OUT: outDir,
        DEV_SHA: "abc123def",
        DEV_BRANCH: "dev",
      },
    });
  return { tmp, dest, outDir, run };
}

test("rsyncs the stamped export into /data/srv/zedkit and does not start docker", async (t) => {
  const { dest, outDir, tmp, run } = await withHarness(t);
  const result = run();
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(await readFile(join(outDir, "dev-build.txt"), "utf8"), /^commit=abc123def$/m);
  assert.equal(
    await readFile(join(dest, "index.html"), "utf8"),
    "<!doctype html><title>docs</title>",
  );
  assert.match(await readFile(join(dest, "dev-build.txt"), "utf8"), /^commit=abc123def$/m);
  assert.match(await readFile(join(tmp, "rsync.log"), "utf8"), /\/data\/srv\/zedkit/);
  assert.equal(existsSync(join(tmp, "docker.log")), false);
});

test("refuses a missing destination directory", async (t) => {
  const { dest, run } = await withHarness(t);
  await rm(dest, { recursive: true, force: true });
  const result = run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing directory/);
});

test("refuses a git worktree at the destination", async (t) => {
  const { dest, run } = await withHarness(t);
  writeFileSync(join(dest, ".git"), "ref: refs/heads/dev\n");
  const result = run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /refusing git worktree/);
});

test("refuses a symlink destination", async (t) => {
  const { dest, tmp, run } = await withHarness(t);
  const real = join(tmp, "elsewhere");
  mkdirSync(real, { recursive: true });
  await rm(dest, { recursive: true, force: true });
  mkdirSync(dirname(dest), { recursive: true });
  symlinkSync(real, dest);
  const result = run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /refusing symlink dest/);
});

test("fails closed when the docs export is missing", async (t) => {
  const { outDir, run } = await withHarness(t);
  await rm(join(outDir, "index.html"));
  const result = run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /index.html not found/);
});
