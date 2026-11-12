import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(root, "deploy/ingest-public-reviews.sh");
const SENTINEL = "KEEP-STAND-IN\n";

function writeExec(file, body) {
  writeFileSync(file, body, { mode: 0o755 });
}

async function withHarness(t) {
  const tmp = await mkdtemp(join(tmpdir(), "ingest-public-reviews-"));
  const bin = join(tmp, "bin");
  const dest = join(tmp, "dest.json");
  const local = join(tmp, "local.json");
  const scpLog = join(tmp, "scp.log");
  const summary = join(tmp, "summary.md");
  mkdirSync(bin, { recursive: true });
  writeFileSync(dest, SENTINEL);
  writeExec(
    join(bin, "scp"),
    `#!/bin/bash
printf '%s\\n' "$*" >> ${JSON.stringify(scpLog)}
exit "\${SCP_EXIT:-1}"
`,
  );
  t.after(async () => {
    await rm(tmp, { recursive: true, force: true });
  });
  const run = (env = {}) => {
    const next = {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      ...env,
    };
    if (!("PUBLIC_REVIEWS_SNAPSHOT" in env)) {
      delete next.PUBLIC_REVIEWS_SNAPSHOT;
    }
    if (!("PUBLIC_REVIEWS_SNAPSHOT_REMOTE" in env)) {
      delete next.PUBLIC_REVIEWS_SNAPSHOT_REMOTE;
    }
    return spawnSync("bash", [script, dest], {
      encoding: "utf8",
      env: next,
    });
  };
  return { tmp, dest, local, scpLog, summary, run };
}

test("unset PUBLIC_REVIEWS_SNAPSHOT exits 0 and keeps dest", async (t) => {
  const { dest, scpLog, run } = await withHarness(t);
  const result = run();
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /PUBLIC_REVIEWS_SNAPSHOT unset; keeping stand-in/);
  assert.equal(await readFile(dest, "utf8"), SENTINEL);
  assert.equal(existsSync(scpLog), false);
});

test("empty PUBLIC_REVIEWS_SNAPSHOT exits 0 and keeps dest", async (t) => {
  const { dest, scpLog, run } = await withHarness(t);
  const result = run({ PUBLIC_REVIEWS_SNAPSHOT: "" });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /PUBLIC_REVIEWS_SNAPSHOT unset; keeping stand-in/);
  assert.equal(await readFile(dest, "utf8"), SENTINEL);
  assert.equal(existsSync(scpLog), false);
});

test("PUBLIC_REVIEWS_SNAPSHOT starting with - exits non-zero and skips scp", async (t) => {
  const { dest, scpLog, run } = await withHarness(t);
  const result = run({ PUBLIC_REVIEWS_SNAPSHOT: "-oProxyCommand=true" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must not start with -/);
  assert.equal(await readFile(dest, "utf8"), SENTINEL);
  assert.equal(existsSync(scpLog), false);
});

test("PUBLIC_REVIEWS_SNAPSHOT_REMOTE starting with - exits non-zero and skips scp", async (t) => {
  const { dest, local, scpLog, run } = await withHarness(t);
  const result = run({
    PUBLIC_REVIEWS_SNAPSHOT: local,
    PUBLIC_REVIEWS_SNAPSHOT_REMOTE: "-oProxyCommand=true",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must not start with -/);
  assert.equal(await readFile(dest, "utf8"), SENTINEL);
  assert.equal(existsSync(scpLog), false);
});

test("scp non-zero exits 0, keeps dest, and logs the exit code", async (t) => {
  const { dest, local, scpLog, summary, run } = await withHarness(t);
  const result = run({
    PUBLIC_REVIEWS_SNAPSHOT: local,
    PUBLIC_REVIEWS_SNAPSHOT_REMOTE: "exports/public-reviews.json",
    SCP_EXIT: "7",
    GITHUB_STEP_SUMMARY: summary,
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /generated run index scp failed \(exit 7\); keeping stand-in/);
  assert.equal(await readFile(dest, "utf8"), SENTINEL);
  assert.match(await readFile(scpLog, "utf8"), /zed-dev:exports\/public-reviews\.json/);
  assert.match(await readFile(summary, "utf8"), /scp failed \(exit 7\); keeping stand-in/);
});

test("missing local file exits 0 and keeps dest", async (t) => {
  const { dest, local, scpLog, run } = await withHarness(t);
  const result = run({ PUBLIC_REVIEWS_SNAPSHOT: local });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /generated run index missing; keeping stand-in/);
  assert.equal(await readFile(dest, "utf8"), SENTINEL);
  assert.equal(existsSync(scpLog), false);
});

test("unsafe present file exits non-zero and keeps dest", async (t) => {
  const { dest, local, run } = await withHarness(t);
  writeFileSync(local, "{");
  const result = run({ PUBLIC_REVIEWS_SNAPSHOT: local });
  assert.notEqual(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stderr, /invalid JSON/);
  assert.equal(await readFile(dest, "utf8"), SENTINEL);
});
