import { readdirSync, readFileSync } from "node:fs";
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

/** npm package name for changeset gate (matches Python: @zedtech/zedkit-<pkg dir>). */
function npmPackageForEntrySpec(spec) {
  const pkg = spec.split("|", 1)[0];
  return `@zedtech/zedkit-${pkg}`;
}

function reportPathForEntrySpec(spec) {
  const [pkg, , report] = spec.split("|");
  return `packages/${pkg}/etc/${report}`;
}

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

test("changeset gate uses shell entries as single source (includes marketing)", () => {
  assert.doesNotMatch(
    script,
    /reports\s*=\s*\[\s*\(\s*"packages\//,
    "Python must not define a duplicate literal reports tuple list",
  );
  assert.match(script, /reports\s*=\s*\[\]/, "Python builds reports from argv");
  assert.match(
    script,
    /python3\s+-\s+"\$\{entries\[@\]\}"/,
    "changeset gate must pass shell entries to Python on argv",
  );

  const entries = shellEntryLines();
  assert.ok(
    entries.some((e) => e.endsWith("|zedkit-ui-marketing.api.md")),
    "shell entries must include zedkit-ui-marketing.api.md",
  );

  const marketing = entries.find((e) => e.endsWith("|zedkit-ui-marketing.api.md"));
  assert.equal(
    npmPackageForEntrySpec(marketing),
    "@zedtech/zedkit-ui",
    "marketing API report maps to @zedtech/zedkit-ui",
  );
  assert.equal(
    reportPathForEntrySpec(marketing),
    "packages/ui/etc/zedkit-ui-marketing.api.md",
  );

  assert.match(
    script,
    /npm_pkg\s*=\s*f"@zedtech\/zedkit-\{pkg\}"/,
    "changeset gate maps package dir to @zedtech/zedkit-<dir> (ui motion/marketing share ui)",
  );
});

test("changeset gate skips the version PR branch", () => {
  assert.match(script, /changeset-release\/main/);
  assert.match(script, /skip changeset gate on version PR/);
});

test("extractor runs in parallel on GNU xargs and falls back otherwise", () => {
  assert.match(script, /xargs -P "\$\{API_EXTRACTOR_JOBS:-4\}"/);
  assert.match(script, /BSD xargs has no -P/);
});
