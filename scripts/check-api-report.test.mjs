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

function runChangesetGate(cwd, argv, env = {}) {
  const childEnv = { ...process.env };
  // Gate skip is GITHUB_HEAD_REF; strip CI branch vars so Version PR CI does not skip fixtures.
  delete childEnv.GITHUB_HEAD_REF;
  delete childEnv.GITHUB_REF;
  delete childEnv.GITHUB_BASE_REF;
  Object.assign(childEnv, env);
  const result = spawnSync(process.execPath, [join(root, "scripts/api-report-changeset-gate.mjs"), ...argv], {
    cwd,
    encoding: "utf8",
    env: childEnv,
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

const SEO_IMPORT = 'import type { SoftwareSourceCode, WithContext } from "schema-dts";\n';
const SEO_IFACE = `export interface SoftwareSourceCodeJsonLdOptions {
  name: string;
  url: string;
  codeRepository: string;
  programmingLanguage?: string;
  license?: string;
}`;
const SEO_FN = `export function buildSoftwareSourceCodeJsonLd(options: SoftwareSourceCodeJsonLdOptions): WithContext<SoftwareSourceCode> {
  return { "@type": "SoftwareSourceCode" };
}`;
const SEO_REPORT_CATCHUP = `## API Report File for "@zedtech/zedkit-seo"

\`\`\`ts
import type { SoftwareSourceCode } from 'schema-dts';
import type { WithContext } from 'schema-dts';

export function buildSoftwareSourceCodeJsonLd(options: SoftwareSourceCodeJsonLdOptions): WithContext<SoftwareSourceCode>;

export interface SoftwareSourceCodeJsonLdOptions {
    codeRepository: string;
    license?: string;
    name: string;
    programmingLanguage?: string;
    url: string;
}
\`\`\`
`;

function writeSeoSource(dir, { index, jsonld } = {}) {
  mkdirSync(join(dir, "packages/seo/src"), { recursive: true });
  mkdirSync(join(dir, "packages/seo/etc"), { recursive: true });
  writeFileSync(
    join(dir, "packages/seo/src/index.ts"),
    index ?? `export { buildSoftwareSourceCodeJsonLd, type SoftwareSourceCodeJsonLdOptions } from "./jsonld.js";\n`,
  );
  writeFileSync(join(dir, "packages/seo/src/jsonld.ts"), jsonld ?? `${SEO_IMPORT}\n${SEO_IFACE}\n\n${SEO_FN}\n`);
}

function initSeoCatchUpRepo({ index, jsonld, headReport } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "api-report-seo-catchup-"));
  execSync("git init -q", { cwd: dir });
  execSync('git config user.email "test@test"', { cwd: dir });
  execSync('git config user.name "test"', { cwd: dir });
  writeSeoSource(dir, { index, jsonld });
  writeFileSync(
    join(dir, "packages/seo/etc/zedkit-seo.api.md"),
    `## API Report File for "@zedtech/zedkit-seo"

\`\`\`ts

\`\`\`
`,
  );
  execSync("git add -A && git commit -q -m base", { cwd: dir });
  const base = execSync("git rev-parse HEAD", { cwd: dir, encoding: "utf8" }).trim();
  execSync(`git update-ref refs/remotes/origin/main ${base}`, { cwd: dir });
  writeFileSync(join(dir, "packages/seo/etc/zedkit-seo.api.md"), headReport ?? SEO_REPORT_CATCHUP);
  execSync("git add -A && git commit -q -m report", { cwd: dir });
  return dir;
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

test("changeset gate fails when catch-up types are imported from a different module", (t) => {
  const dir = initSeoCatchUpRepo({
    index: `import { Options } from "pkg-a";
export function f(x: Options): Options { return x; }
`,
    jsonld: "export {}\n",
    headReport: `## API Report File for "@zedtech/zedkit-seo"

\`\`\`ts
import { Options } from 'pkg-b';

export function f(x: Options): Options;
\`\`\`
`,
  });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const out = runChangesetGate(dir, entries);
  assert.notEqual(out.status, 0);
  assert.match(`${out.stderr}${out.stdout}`, /packages\/seo\/etc\/zedkit-seo\.api\.md: API report changed/);
});

test("changeset gate skips SEO report catch-up when origin/main public declarations match", (t) => {
  const dir = initSeoCatchUpRepo();
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const out = runChangesetGate(dir, entries);
  assert.equal(out.status, 0, `${out.stderr}${out.stdout}`);
  assert.match(`${out.stderr}${out.stdout}`, /exact catch-up of public declarations already on origin\/main/);
});

test("changeset gate fails when the added catch-up signature does not match origin/main", (t) => {
  const dir = initSeoCatchUpRepo({
    jsonld: `${SEO_IFACE}\n\nexport function buildSoftwareSourceCodeJsonLd(options: SoftwareSourceCodeJsonLdOptions): string {\n  return "";\n}\n`,
  });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const out = runChangesetGate(dir, entries);
  assert.notEqual(out.status, 0);
  assert.match(`${out.stderr}${out.stdout}`, /packages\/seo\/etc\/zedkit-seo\.api\.md: API report changed/);
});

test("changeset gate fails when an existing interface property changes beside a catch-up export", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "api-report-seo-prop-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  execSync("git init -q", { cwd: dir });
  execSync('git config user.email "test@test"', { cwd: dir });
  execSync('git config user.name "test"', { cwd: dir });
  writeSeoSource(dir);
  writeFileSync(
    join(dir, "packages/seo/etc/zedkit-seo.api.md"),
    `## API Report File for "@zedtech/zedkit-seo"

\`\`\`ts
export interface ArticleJsonLdOptions {
    title: string;
}
\`\`\`
`,
  );
  execSync("git add -A && git commit -q -m base", { cwd: dir });
  const base = execSync("git rev-parse HEAD", { cwd: dir, encoding: "utf8" }).trim();
  execSync(`git update-ref refs/remotes/origin/main ${base}`, { cwd: dir });
  writeFileSync(
    join(dir, "packages/seo/etc/zedkit-seo.api.md"),
    `## API Report File for "@zedtech/zedkit-seo"

\`\`\`ts
import type { SoftwareSourceCode } from 'schema-dts';
import type { WithContext } from 'schema-dts';

export interface ArticleJsonLdOptions {
    title?: string;
}

export function buildSoftwareSourceCodeJsonLd(options: SoftwareSourceCodeJsonLdOptions): WithContext<SoftwareSourceCode>;

export interface SoftwareSourceCodeJsonLdOptions {
    codeRepository: string;
    license?: string;
    name: string;
    programmingLanguage?: string;
    url: string;
}
\`\`\`
`,
  );
  execSync("git add -A && git commit -q -m report", { cwd: dir });
  const out = runChangesetGate(dir, entries);
  assert.notEqual(out.status, 0);
  assert.match(`${out.stderr}${out.stdout}`, /packages\/seo\/etc\/zedkit-seo\.api\.md: API report changed/);
});

test("changeset gate fails when the catch-up name only appears in a comment on origin/main", (t) => {
  const dir = initSeoCatchUpRepo({
    index: "// buildSoftwareSourceCodeJsonLd SoftwareSourceCodeJsonLdOptions\nexport function otherFn(): void {}\n",
    jsonld: `${SEO_IFACE}\n\n${SEO_FN}\n`,
  });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const out = runChangesetGate(dir, entries);
  assert.notEqual(out.status, 0);
  assert.match(`${out.stderr}${out.stdout}`, /packages\/seo\/etc\/zedkit-seo\.api\.md: API report changed/);
});

test("changeset gate fails when a catch-up interface generic constraint does not match origin/main", (t) => {
  const dir = initSeoCatchUpRepo({
    jsonld: `export interface SoftwareSourceCodeJsonLdOptions<T extends number> {
  name: T;
}
${SEO_FN}
`,
  });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const out = runChangesetGate(dir, entries);
  assert.notEqual(out.status, 0);
  assert.match(`${out.stderr}${out.stdout}`, /packages\/seo\/etc\/zedkit-seo\.api\.md: API report changed/);
});

test("changeset gate fails when HEAD adds the original name of export { hidden as visible }", (t) => {
  const dir = initSeoCatchUpRepo({
    index: 'export { hidden as visible } from "./jsonld.js";\n',
    jsonld: "export function hidden(): void {}\n",
    headReport: `## API Report File for "@zedtech/zedkit-seo"

\`\`\`ts
export function hidden(): void;
\`\`\`
`,
  });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const out = runChangesetGate(dir, entries);
  assert.notEqual(out.status, 0);
  assert.match(`${out.stderr}${out.stdout}`, /packages\/seo\/etc\/zedkit-seo\.api\.md: API report changed/);
});

test("changeset gate fails when HEAD catch-up lists only the first overload", (t) => {
  const dir = initSeoCatchUpRepo({
    index: `export function foo(x: string): void;
export function foo(x: number): void;
export function foo(x: string | number): void {}\n`,
    jsonld: "export {}\n",
    headReport: `## API Report File for "@zedtech/zedkit-seo"

\`\`\`ts
export function foo(x: string): void;
\`\`\`
`,
  });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const out = runChangesetGate(dir, entries);
  assert.notEqual(out.status, 0);
  assert.match(`${out.stderr}${out.stdout}`, /packages\/seo\/etc\/zedkit-seo\.api\.md: API report changed/);
});

test("changeset gate fails when a fake export lives in a block comment or template string", (t) => {
  const commentDir = initSeoCatchUpRepo({
    index: `/*
export { buildSoftwareSourceCodeJsonLd, type SoftwareSourceCodeJsonLdOptions } from "./jsonld.js";
*/
export function otherFn(): void {}
`,
  });
  t.after(() => rmSync(commentDir, { recursive: true, force: true }));
  const commentOut = runChangesetGate(commentDir, entries);
  assert.notEqual(commentOut.status, 0);
  assert.match(`${commentOut.stderr}${commentOut.stdout}`, /packages\/seo\/etc\/zedkit-seo\.api\.md: API report changed/);

  const templateDir = initSeoCatchUpRepo({
    index:
      "const s = `\nexport { buildSoftwareSourceCodeJsonLd, type SoftwareSourceCodeJsonLdOptions } from \"./jsonld.js\";\n`;\nexport function otherFn(): void {}\n",
  });
  t.after(() => rmSync(templateDir, { recursive: true, force: true }));
  const templateOut = runChangesetGate(templateDir, entries);
  assert.notEqual(templateOut.status, 0);
  assert.match(`${templateOut.stderr}${templateOut.stdout}`, /packages\/seo\/etc\/zedkit-seo\.api\.md: API report changed/);
});

test("changeset gate fails when the catch-up name only appears in an import on origin/main", (t) => {
  const dir = initSeoCatchUpRepo({
    index: 'import { buildSoftwareSourceCodeJsonLd, type SoftwareSourceCodeJsonLdOptions } from "./jsonld.js";\nexport function otherFn(): void {}\n',
  });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const out = runChangesetGate(dir, entries);
  assert.notEqual(out.status, 0);
  assert.match(`${out.stderr}${out.stdout}`, /packages\/seo\/etc\/zedkit-seo\.api\.md: API report changed/);
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
  const gate = readFileSync(join(root, "scripts/api-report-changeset-gate.mjs"), "utf8");
  assert.match(gate, /changeset-release\/main/);
  assert.match(script, /api-report-changeset-gate\.mjs/);
  const dir = mkdtempSync(join(tmpdir(), "api-report-version-pr-"));
  const out = runChangesetGate(dir, entries, { GITHUB_HEAD_REF: "changeset-release/main" });
  assert.equal(out.status, 0, `${out.stderr}${out.stdout}`);
  assert.match(`${out.stderr}${out.stdout}`, /skip changeset gate on version PR/);
  rmSync(dir, { recursive: true, force: true });
});

test("changeset gate fixtures ignore inherited GITHUB_HEAD_REF from a Version PR", (t) => {
  const prev = process.env.GITHUB_HEAD_REF;
  process.env.GITHUB_HEAD_REF = "changeset-release/main";
  t.after(() => {
    if (prev === undefined) delete process.env.GITHUB_HEAD_REF;
    else process.env.GITHUB_HEAD_REF = prev;
  });
  const { dir } = initRepoWithMarketingDiff({ withChangeset: false });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const out = runChangesetGate(dir, entries);
  assert.notEqual(out.status, 0);
  assert.doesNotMatch(`${out.stderr}${out.stdout}`, /skip changeset gate on version PR/);
  assert.match(
    `${out.stderr}${out.stdout}`,
    /packages\/ui\/etc\/zedkit-ui-marketing\.api\.md: API report changed/,
  );
});

test("extractor runs in parallel on GNU xargs and falls back otherwise", () => {
  assert.match(script, /xargs -P "\$\{API_EXTRACTOR_JOBS:-4\}"/);
  assert.match(script, /BSD xargs has no -P/);
});
