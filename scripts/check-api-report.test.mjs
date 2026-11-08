import { execSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";

const root = join(import.meta.dirname, "..");
const script = readFileSync(join(root, "scripts/check-api-report.sh"), "utf8");

/** Every publishable workspace package under packages/* (16 today). */
function packageDirs() {
  return readdirSync(join(root, "packages"), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function entryPackagesFromScript() {
  const found = new Set();
  for (const line of script.split("\n")) {
    const match = line.match(/^\s*"([a-z0-9-]+)\|/);
    if (match) found.add(match[1]);
  }
  return [...found].sort();
}

function shellEntryLines() {
  const lines = [];
  let inEntries = false;
  for (const line of script.split("\n")) {
    if (line.match(/^entries=\(/)) {
      inEntries = true;
      continue;
    }
    if (inEntries) {
      const match = line.match(/^\s*"([^"]+)"/);
      if (match) lines.push(match[1]);
      if (line.match(/^\)/)) break;
    }
  }
  return lines;
}

function extractChangesetGatePython() {
  const marker = "python3 - \"${entries[@]}\" <<'PY'";
  const start = script.indexOf(marker);
  assert.ok(start >= 0, "changeset gate Python block missing");
  const bodyStart = script.indexOf("\n", start) + 1;
  const end = script.indexOf("\nPY\n", bodyStart);
  assert.ok(end > bodyStart, "PY terminator missing");
  return script.slice(bodyStart, end + 1);
}

function runChangesetGate(cwd, argv, env = {}) {
  const py = extractChangesetGatePython();
  const result = spawnSync("python3", ["-", ...argv], {
    cwd,
    encoding: "utf8",
    input: py,
    env: { ...process.env, ...env },
  });
  return {
    status: result.status ?? 1,
    stderr: String(result.stderr ?? ""),
    stdout: String(result.stdout ?? ""),
  };
}

function initRepoWithMarketingDiff({ withChangeset }) {
  const dir = mkdtempSync(join(tmpdir(), "api-report-gate-"));
  execSync("git init -q", { cwd: dir });
  execSync('git config user.email "test@test"', { cwd: dir });
  execSync('git config user.name "test"', { cwd: dir });

  const reportPath = "packages/ui/etc/zedkit-ui-marketing.api.md";
  mkdirSync(join(dir, "packages/ui/etc"), { recursive: true });
  writeFileSync(join(dir, reportPath), "export {}\n");
  execSync("git add -A && git commit -q -m base", { cwd: dir });
  const base = execSync("git rev-parse HEAD", { cwd: dir, encoding: "utf8" }).trim();
  execSync(`git update-ref refs/remotes/origin/main ${base}`, { cwd: dir });

  writeFileSync(join(dir, reportPath), "export { x: 1 }\n");
  execSync("git add -A && git commit -q -m head", { cwd: dir });

  if (withChangeset) {
    mkdirSync(join(dir, ".changeset"), { recursive: true });
    writeFileSync(
      join(dir, ".changeset/ui-marketing.md"),
      `---
"@zedtech/zedkit-ui": minor
---

marketing api touch
`,
    );
    execSync("git add -A && git commit -q -m changeset", { cwd: dir });
  }

  return { dir, reportPath };
}

const entries = shellEntryLines();
const marketingEntry = entries.find((e) => e.endsWith("|zedkit-ui-marketing.api.md"));
assert.ok(marketingEntry, "shell entries must include zedkit-ui-marketing.api.md");

test("check-api-report.sh lists every packages/* workspace package", () => {
  const want = packageDirs();
  assert.equal(want.length, 16, "update this test if the workspace package count changes");
  const have = entryPackagesFromScript();
  assert.deepEqual(
    have,
    want,
    `entries in check-api-report.sh must cover all packages; missing: ${want.filter((p) => !have.includes(p)).join(", ")}`,
  );
});

test("changeset gate fails when marketing API report changes without a changeset", (t) => {
  const { dir } = initRepoWithMarketingDiff({ withChangeset: false });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const out = runChangesetGate(dir, entries);
  assert.notEqual(out.status, 0);
  assert.match(
    `${out.stderr}${out.stdout}`,
    /packages\/ui\/etc\/zedkit-ui-marketing\.api\.md: API report changed/,
  );
});

test("changeset gate passes when @zedtech/zedkit-ui has a changeset", (t) => {
  const { dir } = initRepoWithMarketingDiff({ withChangeset: true });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const out = runChangesetGate(dir, entries);
  assert.equal(out.status, 0, `${out.stderr}${out.stdout}`);
  assert.match(`${out.stderr}${out.stdout}`, /changeset gate ok/);
});

test("changeset gate rejects empty argv", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "api-report-empty-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  execSync("git init -q", { cwd: dir });
  execSync('git config user.email "test@test"', { cwd: dir });
  execSync('git config user.name "test"', { cwd: dir });
  writeFileSync(join(dir, "README"), "x\n");
  execSync("git add -A && git commit -q -m base", { cwd: dir });
  const base = execSync("git rev-parse HEAD", { cwd: dir, encoding: "utf8" }).trim();
  execSync(`git update-ref refs/remotes/origin/main ${base}`, { cwd: dir });
  const out = runChangesetGate(dir, []);
  assert.notEqual(out.status, 0);
  assert.match(`${out.stderr}${out.stdout}`, /api-report: no entries/);
});

test("changeset gate skips the version PR branch", () => {
  assert.match(script, /changeset-release\/main/);
  assert.match(script, /skip changeset gate on version PR/);
});

test("extractor runs in parallel on GNU xargs and falls back otherwise", () => {
  assert.match(script, /xargs -P "\$\{API_EXTRACTOR_JOBS:-4\}"/);
  assert.match(script, /BSD xargs has no -P/);
});
