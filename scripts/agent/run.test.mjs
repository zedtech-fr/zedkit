import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  DIFF_EXCLUDES,
  LIMITS,
  buildE2eArgv,
  buildLintArgv,
  buildNodeTestArgv,
  buildTestArgv,
  buildTypecheckArgv,
  capLines,
  defaultNodeTestGlobs,
  formatDiff,
  formatDuration,
  formatE2eSummary,
  formatLintSummary,
  formatNodeTestSummary,
  formatPr,
  formatStatus,
  formatTypecheckSummary,
  groupLintMessages,
  isExcludedDiffPath,
  peelNodeTestArgs,
  parseJson,
  parseNodeTestFailures,
  parseNodeTestStats,
  parseTscErrors,
  parseVitestFailures,
  resolveLintTargets,
  run,
} from "./run.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));
const artifacts = readFileSync(join(root, "scripts/check-no-artifacts.sh"), "utf8");
const gitignore = readFileSync(join(root, ".gitignore"), "utf8");

const TAP_FAIL = `TAP version 13
# Subtest: boom
not ok 1 - boom
  ---
  duration_ms: 1.3
  type: 'test'
  location: '/repo/scripts/agent/run.test.mjs:12:1'
  failureType: 'testCodeFailure'
  error: |-
    Expected values to be strictly equal:

    1 !== 2

  code: 'ERR_ASSERTION'
  name: 'AssertionError'
  ...
1..1
# tests 4
# pass 3
# fail 1
# skipped 0
# duration_ms 42.5
`;

const VITEST_FAIL = `
 FAIL  packages/core/src/foo.test.ts > foo > bar
AssertionError: expected 1 to be 2
 ❯ packages/core/src/foo.test.ts:14:5

 Test Files  1 failed | 10 passed (11)
      Tests  2 failed | 80 passed (82)
`;

function scratch(t, prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function capture(argv, deps) {
  const chunks = [];
  const code = run(argv, {
    write: (chunk) => chunks.push(chunk),
    now: () => new Date("2026-11-13T17:02:00.000Z"),
    durationMs: 1234,
    pid: 1,
    ...deps,
  });
  return { code, out: chunks.join("") };
}

const STAMP = "2026-11-13T17-02-00-000Z-1";

describe("capLines", () => {
  it("leaves short text alone", () => {
    assert.equal(capLines("a\nb", 5), "a\nb");
  });

  it("truncates with a clear omitted-line notice", () => {
    const text = Array.from({ length: 5 }, (_, i) => `L${i}`).join("\n");
    assert.equal(capLines(text, 2), "L0\nL1\n… truncated 3 more lines");
  });
});

describe("lint grouping", () => {
  const files = [
    {
      filePath: "/repo/packages/core/src/a.ts",
      messages: [
        { severity: 2, line: 10, ruleId: "no-unused-vars", message: "'x' is defined but never used" },
        { severity: 2, line: 11, ruleId: "no-unused-vars", message: "'y' is defined but never used" },
        { severity: 1, line: 1, ruleId: "eqeqeq", message: "Expected ===" },
      ],
    },
    {
      filePath: "/repo/packages/core/src/b.ts",
      messages: [{ severity: 2, line: 3, ruleId: "no-restricted-syntax", message: "try-catch" }],
    },
  ];

  it("groups errors by rule × count and ignores warnings in the error tally", () => {
    const grouped = groupLintMessages(files, "/repo");
    assert.equal(grouped.errorCount, 3);
    assert.equal(grouped.warningCount, 1);
    assert.deepEqual(
      grouped.rules.map(([rule, count]) => `${rule} × ${count}`),
      ["no-unused-vars × 2", "no-restricted-syntax × 1"],
    );
  });

  it("is silent on clean files", () => {
    const out = formatLintSummary([], { status: 0, ms: 100, logPath: "log", cwd: "/repo" });
    assert.match(out, /^PASS /);
    assert.doesNotMatch(out, /packages\//);
  });

  it("prints first lint rows then a truncation notice", () => {
    const many = Array.from({ length: 25 }, (_, i) => ({
      filePath: `/repo/f${i}.ts`,
      messages: [{ severity: 2, line: i + 1, ruleId: "eqeqeq", message: "use ===" }],
    }));
    const out = formatLintSummary(many, { status: 1, ms: 10, logPath: "log", cwd: "/repo" });
    assert.match(out, /eqeqeq × 25/);
    assert.match(out, new RegExp(`… truncated ${25 - LIMITS.lintRows} more errors`));
  });
});

describe("typecheck formatting", () => {
  const raw = [
    "packages/core/src/a.ts(10,5): error TS2322: Type 'string' is not assignable to type 'number'.",
    "@zedtech/zedkit-core:typecheck: src/b.ts:2:1 - error TS2304: Cannot find name 'foo'.",
  ].join("\n");

  it("parses both tsc pretty and parens forms", () => {
    const errors = parseTscErrors(raw);
    assert.equal(errors.length, 2);
    assert.equal(errors[0]?.code, "TS2322");
    assert.equal(errors[0]?.file, "packages/core/src/a.ts");
    assert.equal(errors[1]?.code, "TS2304");
    assert.equal(errors[1]?.file, "src/b.ts");
  });

  it("prints error count and file(line,col): TSxxxx", () => {
    const out = formatTypecheckSummary({ raw, status: 1, ms: 2000, logPath: "log", cwd: "/repo" });
    assert.match(out, /^FAIL {2}errors=2/);
    assert.match(out, /packages\/core\/src\/a\.ts\(10,5\): TS2322/);
    assert.match(out, /src\/b\.ts\(2,1\): TS2304/);
    assert.doesNotMatch(out, /@zedtech\/zedkit-core:typecheck:/);
  });
});

describe("vitest formatting", () => {
  it("extracts failing file:line and the assertion message", () => {
    const fails = parseVitestFailures(VITEST_FAIL);
    assert.equal(fails.length, 1);
    assert.equal(fails[0]?.file, "packages/core/src/foo.test.ts");
    assert.equal(fails[0]?.line, 14);
    assert.match(fails[0]?.message ?? "", /expected 1 to be 2/);
  });
});

describe("node-test formatting", () => {
  it("reads TAP counts, location, and first error line", () => {
    const stats = parseNodeTestStats(TAP_FAIL);
    assert.deepEqual(stats, { tests: 4, pass: 3, fail: 1, skipped: 0, durationMs: 42.5 });
    const fails = parseNodeTestFailures(TAP_FAIL);
    assert.equal(fails.length, 1);
    assert.equal(fails[0]?.file, "/repo/scripts/agent/run.test.mjs");
    assert.equal(fails[0]?.line, 12);
    assert.equal(fails[0]?.title, "boom");
    assert.match(fails[0]?.message ?? "", /strictly equal/);
  });

  it("caps failure lines and always prints the log path", () => {
    const many = Array.from({ length: 40 }, (_, i) => `not ok ${i + 1} - t${i}\n  location: '/repo/f.test.mjs:${i + 1}:1'\n`).join(
      "",
    );
    const out = formatNodeTestSummary({
      raw: `${many}\n# tests 40\n# fail 40\n# pass 0\n`,
      status: 1,
      ms: 10,
      logPath: ".agent-logs/x-node-test.log",
      cwd: "/repo",
    });
    assert.match(out, /^FAIL {2}tests=40 failed \/ 40/);
    assert.match(out, /truncated 10 more lines/);
    assert.match(out, /LOG {2}\.agent-logs\/x-node-test\.log/);
  });

  it("peels node --test argv off `test` and treats .mjs globs as node-test", () => {
    assert.deepEqual(peelNodeTestArgs(["node", "--test", "scripts/foo.test.mjs"]).rest, ["scripts/foo.test.mjs"]);
    assert.equal(peelNodeTestArgs(["scripts/*.test.mjs"]).nodeTest, true);
    assert.equal(peelNodeTestArgs(["@zedtech/zedkit-core"]).nodeTest, false);
    assert.equal(peelNodeTestArgs(["packages/core/src/foo.test.ts"]).nodeTest, false);
    assert.equal(peelNodeTestArgs(["--reporter=json"]).nodeTest, false);
    assert.equal(peelNodeTestArgs(["--test-name-pattern", "foo"]).nodeTest, false);
    assert.equal(peelNodeTestArgs(["--reporter=json", "scripts/foo.test.mjs"]).nodeTest, true);
  });

  it("defaults node-test globs to test:registry:nodeploy", () => {
    const globs = defaultNodeTestGlobs(root);
    assert.ok(globs.includes("scripts/*.test.mjs"));
    assert.ok(globs.includes("scripts/agent/*.test.mjs"));
    const built = buildNodeTestArgv([], { cwd: root, execPath: "node" });
    assert.equal(built.command, "node");
    assert.equal(built.argv[0], "--test");
    assert.ok(built.argv.includes("scripts/*.test.mjs"));
  });
});

describe("diff exclusions", () => {
  it("knows lockfile, catalog, and registry.json", () => {
    assert.equal(isExcludedDiffPath("pnpm-lock.yaml"), true);
    assert.equal(isExcludedDiffPath("docs/catalog/catalog.json"), true);
    assert.equal(isExcludedDiffPath("registry.json"), true);
    assert.equal(isExcludedDiffPath("packages/ui/registry.json"), true);
    assert.equal(isExcludedDiffPath("scripts/agent/run.mjs"), false);
    assert.ok(DIFF_EXCLUDES.includes(":!pnpm-lock.yaml"));
  });

  it("caps the diff and lists excluded files that changed", () => {
    const diff = Array.from({ length: 90 }, (_, i) => `+line ${i}`).join("\n");
    const out = formatDiff(diff, { excluded: ["pnpm-lock.yaml", "docs/catalog/catalog.json"] });
    assert.match(out, /truncated \d+ more lines/);
    assert.match(out, /excluded \(changed\): pnpm-lock\.yaml, docs\/catalog\/catalog\.json/);
  });
});

describe("e2e and pr summaries", () => {
  it("prints failing Playwright tests and trace paths", () => {
    const json = {
      stats: { unexpected: 1, expected: 9, skipped: 0, duration: 5000 },
      suites: [
        {
          specs: [
            {
              title: "home hero",
              file: "tests/home.spec.ts",
              tests: [
                {
                  results: [
                    {
                      status: "failed",
                      error: { message: "timeout\nmore", location: { line: 42 } },
                      attachments: [{ name: "trace", path: "test-results/home/trace.zip" }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const out = formatE2eSummary({
      raw: "",
      json,
      status: 1,
      ms: 5000,
      logPath: "log",
      jsonPath: "json",
      cwd: "/repo",
    });
    assert.match(out, /^FAIL {2}failed=1 {2}passed=9/);
    assert.match(out, /tests\/home\.spec\.ts:42 {2}home hero {2}timeout/);
    assert.match(out, /trace {2}test-results\/home\/trace\.zip/);
    assert.match(out, /JSON json/);
  });

  it("prints PR state/url/mergeable and only failing or pending checks", () => {
    const out = formatPr({
      view: { number: 12, state: "OPEN", url: "https://example.com/pr/12", mergeable: "MERGEABLE" },
      checks: [
        { name: "lint", state: "SUCCESS", bucket: "pass", link: "https://example.com/lint" },
        { name: "test", state: "FAILURE", bucket: "fail", link: "https://example.com/test" },
        { name: "e2e", state: "PENDING", bucket: "pending", link: "https://example.com/e2e" },
      ],
    });
    assert.match(out, /#12 {2}OPEN {2}https:\/\/example.com\/pr\/12/);
    assert.match(out, /mergeable {2}MERGEABLE/);
    assert.match(out, /FAIL {2}test {2}https:\/\/example.com\/test/);
    assert.match(out, /PENDING {2}e2e/);
    assert.doesNotMatch(out, /lint/);
  });
});

describe("run() wiring", () => {
  it("preserves turbo test exit codes and writes the raw log", (t) => {
    const dir = scratch(t, "agent-run-test-");
    const { code, out } = capture(["test", "@zedtech/zedkit-core"], {
      cwd: dir,
      spawn: (_cmd, args) => {
        assert.ok(args.includes("--output-logs=errors-only"));
        assert.ok(args.includes("--filter=@zedtech/zedkit-core"));
        const dash = args.indexOf("--");
        assert.ok(dash >= 0);
        assert.equal(args[dash + 1], "--reporter=minimal");
        return { status: 17, stdout: VITEST_FAIL, stderr: "" };
      },
    });
    assert.equal(code, 17);
    assert.match(out, /^FAIL /);
    assert.match(out, /packages\/core\/src\/foo\.test\.ts:14/);
    const log = join(dir, ".agent-logs", `${STAMP}-test.log`);
    assert.match(readFileSync(log, "utf8"), /FAIL {2}packages\/core/);
    assert.match(out, new RegExp(`LOG {2}.*${STAMP}-test\\.log`));
  });

  it("routes `test --test` to node --test, not turbo", (t) => {
    const dir = scratch(t, "agent-run-nt-");
    const calls = [];
    const { code, out } = capture(["test", "node", "--test", "scripts/foo.test.mjs"], {
      cwd: dir,
      execPath: "/usr/bin/node",
      spawn: (cmd, args) => {
        calls.push([cmd, args]);
        return { status: 1, stdout: TAP_FAIL, stderr: "" };
      },
    });
    assert.equal(code, 1);
    assert.deepEqual(calls[0], ["/usr/bin/node", ["--test", "scripts/foo.test.mjs"]]);
    assert.match(out, /FAIL {2}tests=1 failed \/ 4/);
    assert.match(out, /run\.test\.mjs:12\b.*boom/);
    assert.match(out, /node-test\.log/);
  });

  it("unknown tasks exit 2 without spawning", () => {
    let spawned = false;
    const { code } = capture(["wat"], { spawn: () => ((spawned = true), { status: 0, stdout: "", stderr: "" }) });
    assert.equal(code, 2);
    assert.equal(spawned, false);
  });

  it("buildTestArgv puts --reporter=minimal after -- even with filters", () => {
    const argv = buildTestArgv(["@zedtech/zedkit-ai"]);
    const dash = argv.indexOf("--");
    assert.ok(dash >= 0);
    assert.equal(argv[dash + 1], "--reporter=minimal");
    assert.ok(argv.slice(0, dash).includes("--filter=@zedtech/zedkit-ai"));
  });

  it("keeps flags-only test args on turbo, not node --test", (t) => {
    const dir = scratch(t, "agent-run-flags-");
    const calls = [];
    capture(["test", "--reporter=json"], {
      cwd: dir,
      spawn: (cmd, args) => {
        calls.push([cmd, args]);
        return { status: 0, stdout: "", stderr: "" };
      },
    });
    assert.equal(calls[0]?.[0], "pnpm");
    assert.ok(calls[0]?.[1].includes("turbo"));
    assert.ok(calls[0]?.[1].includes("--reporter=json"));
  });

  it("preserves lint exit codes and writes the raw log", (t) => {
    const dir = scratch(t, "agent-run-lint-");
    const payload = [
      {
        filePath: `${dir}/a.ts`,
        messages: [{ severity: 2, line: 4, ruleId: "eqeqeq", message: "Expected ===" }],
      },
    ];
    const { code, out } = capture(["lint", "packages/core"], {
      cwd: dir,
      spawn: (_cmd, args) => {
        assert.ok(args.includes("eslint"));
        assert.ok(args.includes("--format"));
        assert.ok(args.includes("json"));
        return { status: 1, stdout: JSON.stringify(payload), stderr: "" };
      },
    });
    assert.equal(code, 1);
    assert.match(out, /^FAIL {2}errors=1/);
    assert.match(out, /eqeqeq/);
    assert.match(readFileSync(join(dir, ".agent-logs", `${STAMP}-lint.log`), "utf8"), /Expected ===/);
  });

  it("hints when lint output is not JSON", (t) => {
    const dir = scratch(t, "agent-run-lint-crash-");
    const { code, out } = capture(["lint"], {
      cwd: dir,
      spawn: () => ({ status: 2, stdout: "Oops, configuration error", stderr: "" }),
    });
    assert.equal(code, 2);
    assert.match(out, /eslint output was not JSON/);
    assert.doesNotMatch(out, /errors=0/);
  });

  it("preserves typecheck exit codes and strips turbo prefixes", (t) => {
    const dir = scratch(t, "agent-run-tsc-");
    const { code, out } = capture(["typecheck", "@zedtech/zedkit-core"], {
      cwd: dir,
      spawn: (_cmd, args) => {
        assert.ok(args.includes("typecheck"));
        assert.ok(args.includes("--pretty"));
        assert.ok(args.includes("false"));
        return {
          status: 1,
          stdout: "@zedtech/zedkit-core:typecheck: src/b.ts:2:1 - error TS2304: Cannot find name 'foo'.\n",
          stderr: "",
        };
      },
    });
    assert.equal(code, 1);
    assert.match(out, /src\/b\.ts\(2,1\): TS2304/);
    assert.doesNotMatch(out, /@zedtech\/zedkit-core:typecheck:/);
  });

  it("derives a typecheck package filter from a test file or exits 2", (t) => {
    const fromTest = buildTypecheckArgv(["packages/core/src/foo.test.ts"]);
    assert.ok(fromTest.includes("--filter=./packages/core"));
    assert.equal(buildTypecheckArgv(["orphan.test.ts"]), null);
    const dir = scratch(t, "agent-run-tsc-orphan-");
    let spawned = false;
    const { code, out } = capture(["typecheck", "orphan.test.ts"], {
      cwd: dir,
      spawn: () => ((spawned = true), { status: 0, stdout: "", stderr: "" }),
    });
    assert.equal(code, 2);
    assert.equal(spawned, false);
    assert.match(out, /could not derive a package filter/);
  });

  it("preserves e2e exit codes and writes the log", (t) => {
    const dir = scratch(t, "agent-run-e2e-");
    const json = JSON.stringify({
      stats: { unexpected: 1, expected: 0, skipped: 0, duration: 100 },
      suites: [],
    });
    const { code, out } = capture(["e2e", "tests/home.spec.ts"], {
      cwd: dir,
      spawn: (_cmd, args) => {
        assert.ok(args.includes("--reporter=json"));
        assert.ok(args.includes("tests/home.spec.ts"));
        return { status: 1, stdout: json, stderr: "" };
      },
    });
    assert.equal(code, 1);
    assert.match(out, /^FAIL /);
    assert.match(out, /LOG /);
    assert.match(readFileSync(join(dir, ".agent-logs", `${STAMP}-e2e.log`), "utf8"), /unexpected/);
  });

  it("writes the full diff to .agent-logs and prints LOG", (t) => {
    const dir = scratch(t, "agent-run-diff-");
    const body = Array.from({ length: 90 }, (_, i) => `+line ${i}`).join("\n");
    const { code, out } = capture(["diff"], {
      cwd: dir,
      spawn: (_cmd, args) => {
        if (args.includes("--name-only")) {
          return { status: 0, stdout: "pnpm-lock.yaml\nscripts/agent/run.mjs\n", stderr: "" };
        }
        return { status: 0, stdout: body, stderr: "" };
      },
    });
    assert.equal(code, 0);
    assert.match(out, /truncated \d+ more lines/);
    assert.match(out, /excluded \(changed\): pnpm-lock\.yaml/);
    assert.match(out, /LOG /);
    const log = readFileSync(join(dir, ".agent-logs", `${STAMP}-diff.log`), "utf8");
    assert.match(log, /\+line 89/);
  });

  it("prints porcelain status and diff --stat", (t) => {
    const dir = scratch(t, "agent-run-status-");
    const { code, out } = capture(["status"], {
      cwd: dir,
      spawn: (_cmd, args) => {
        if (args.includes("--porcelain=v1")) {
          return { status: 0, stdout: "## main\n M scripts/agent/run.mjs\n", stderr: "" };
        }
        return { status: 0, stdout: " scripts/agent/run.mjs | 1 +\n", stderr: "" };
      },
    });
    assert.equal(code, 0);
    assert.match(out, /## main/);
    assert.match(out, /scripts\/agent\/run\.mjs \| 1 \+/);
  });

  it("does not print all green when checks JSON is missing", (t) => {
    const dir = scratch(t, "agent-run-pr-");
    const { code, out } = capture(["pr", "12"], {
      cwd: dir,
      spawn: (_cmd, args) => {
        if (args.includes("view")) {
          return {
            status: 0,
            stdout: JSON.stringify({ number: 12, state: "OPEN", url: "https://example.com/pr/12", mergeable: "MERGEABLE" }),
            stderr: "",
          };
        }
        return { status: 1, stdout: "GraphQL: Resource not accessible", stderr: "gh: checks failed" };
      },
    });
    assert.equal(code, 1);
    assert.doesNotMatch(out, /all green/);
    assert.match(out, /checks {2}failed/);
    assert.match(out, /Resource not accessible/);
  });

  it("rejects leading-dash args on diff and pr", () => {
    let spawned = false;
    const spawn = () => ((spawned = true), { status: 0, stdout: "", stderr: "" });
    const diff = capture(["diff", "--stat"], { spawn });
    assert.equal(diff.code, 2);
    const pr = capture(["pr", "--json"], { spawn });
    assert.equal(pr.code, 2);
    assert.equal(spawned, false);
  });

  it("exits 2 when node-test has no globs", (t) => {
    const dir = scratch(t, "agent-empty-nt-");
    writeFileSync(join(dir, "package.json"), JSON.stringify({ scripts: {} }));
    let spawned = false;
    const { code, out } = capture(["node-test"], {
      cwd: dir,
      spawn: () => ((spawned = true), { status: 0, stdout: "", stderr: "" }),
    });
    assert.equal(code, 2);
    assert.equal(spawned, false);
    assert.match(out, /no globs/);
  });
});

describe("argv builders", () => {
  it("buildTypecheckArgv keeps --pretty false after --", () => {
    const argv = buildTypecheckArgv(["@zedtech/zedkit-core"]);
    const dash = argv.indexOf("--");
    assert.ok(dash >= 0);
    assert.equal(argv[dash + 1], "--pretty");
    assert.equal(argv[dash + 2], "false");
    assert.ok(argv.slice(0, dash).includes("--filter=@zedtech/zedkit-core"));
  });

  it("resolveLintTargets maps package names when the folder exists", () => {
    const targets = resolveLintTargets(["core"], root);
    assert.ok(targets.some((target) => target.includes("packages/core") || target === "packages/core"));
    assert.deepEqual(resolveLintTargets([], root), ["."]);
  });

  it("buildLintArgv always requests json format", () => {
    const argv = buildLintArgv([], root);
    assert.deepEqual(argv.slice(0, 4), ["exec", "eslint", "--format", "json"]);
  });

  it("buildE2eArgv uses the docs filter and line+json reporters", () => {
    const all = buildE2eArgv([]);
    assert.ok(all.includes("@zedtech/zedkit-docs"));
    assert.ok(all.includes("--reporter=line"));
    assert.ok(all.includes("--reporter=json"));
    const one = buildE2eArgv(["apps/docs/tests/home.spec.ts"]);
    assert.ok(one.includes("tests/home.spec.ts"));
    assert.ok(!one.includes("apps/docs/tests/home.spec.ts"));
  });

  it("formatStatus joins porcelain and --stat", () => {
    const out = formatStatus({ porcelain: "## main\n M a.ts\n", stat: " a.ts | 1 +\n" });
    assert.match(out, /## main/);
    assert.match(out, /a\.ts \| 1 \+/);
  });

  it("formatDuration clamps 60s up to the next minute", () => {
    assert.equal(formatDuration(59_500), "59.5s");
    assert.equal(formatDuration(119_600), "2m 00s");
  });

  it("parseJson returns undefined on malformed JSON instead of throwing", () => {
    assert.equal(parseJson("{not json"), undefined);
    assert.deepEqual(parseJson('{"ok":true}'), { ok: true });
  });
});

describe("hygiene", () => {
  it("gitignores .agent-logs and the artifacts check rejects them", () => {
    assert.match(gitignore, /^\.agent-logs\/$/m);
    assert.match(artifacts, /\\.agent-logs/);
  });
});

describe("node-test live spawn", () => {
  it("preserves a failing node --test exit code and stays compact", (t) => {
    const dir = scratch(t, "agent-live-nt-");
    writeFileSync(
      join(dir, "fail.test.mjs"),
      "import { test } from 'node:test';\nimport assert from 'node:assert/strict';\ntest('boom', () => { assert.equal(1, 2); });\n",
    );
    const { code, out } = capture(["node-test", "fail.test.mjs"], { cwd: dir, durationMs: undefined });
    assert.equal(code, 1);
    assert.match(out, /^FAIL /);
    assert.match(out, /boom/);
    assert.match(out, /LOG {2}/);
    assert.ok(out.length < 4000, `summary too large: ${out.length}`);
    const logDir = join(dir, ".agent-logs");
    const logs = readFileSync(join(logDir, `${STAMP}-node-test.log`), "utf8");
    assert.match(logs, /not ok 1 - boom/);
  });
});
