import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ATLAS_MAX_LINES, checkAtlas } from "#atlas.js";
import { main } from "#cli.js";
import { kitDir } from "#kit.js";
import { put, tempDir } from "./helpers.js";

const repo = fileURLToPath(new URL("../../../../", import.meta.url));

const HEAD = "| Topic | Entry | Why it lives there / trap | Checked |\n| --- | --- | --- | --- |\n";
const atlas = (...rows: string[]): string => `# Atlas\n\n## Where\n\n${HEAD}${rows.join("\n")}\n\n## Run\n\n| Intent | Command | Note |\n| --- | --- | --- |\n| Test | \`pnpm test\` | |\n`;

function project(text: string): string {
  const root = tempDir();
  put(root, ".agents/atlas.md", text);
  return root;
}

function run(...argv: string[]): { code: number; text: string } {
  const out: string[] = [];
  const code = main(argv, { out: (line) => out.push(line), err: (line) => out.push(line) });
  return { code, text: out.join("\n") };
}

describe("checkAtlas", () => {
  it("is silent when there is no atlas and none is required", () => {
    const root = tempDir();
    expect(checkAtlas(root, join(root, ".agents"))).toEqual([]);
  });

  it("accepts rows whose entry paths exist, with or without :line and a trailing slash", () => {
    const root = project(atlas("| Auth | `src/auth/` | why | 2026-01-01 |", "| Login | `src/login.ts:12-30`, `README.md` | why | 2026-01-01 |"));
    put(root, "src/auth/index.ts", "x");
    put(root, "src/login.ts", `${"line\n".repeat(29)}last\n`);
    put(root, "README.md", "x");
    expect(checkAtlas(root, join(root, ".agents"))).toEqual([]);
  });

  it("resolves an anchor silently after lines are inserted above it", () => {
    const root = project(atlas("| Gate | `src/gate.ts#runGate#writes to a temp file` | why | 2026-01-01 |"));
    put(root, "src/gate.ts", "export function runGate() {\n  // writes to a temp file\n}\n");
    expect(checkAtlas(root, join(root, ".agents"))).toEqual([]);
    put(root, "src/gate.ts", `${"// inserted\n".repeat(20)}export function runGate() {\n  // writes to a temp file\n}\n`);
    expect(checkAtlas(root, join(root, ".agents"))).toEqual([]);
  });

  it("reports a renamed symbol instead of passing on the unchanged path", () => {
    const root = project(atlas("| Gate | `src/gate.ts#runGate` | why | 2026-01-01 |"));
    put(root, "src/gate.ts", "export function runGateV2() {}\n");
    const issues = checkAtlas(root, join(root, ".agents"));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain("runGate");
    expect(issues[0]?.message).toContain("Gate");
  });

  it("reports a changed excerpt while the path and symbol still exist", () => {
    const root = project(atlas("| Gate | `src/gate.ts#runGate#writes to a temp file` | why | 2026-01-01 |"));
    put(root, "src/gate.ts", "export function runGate() {\n  // writes elsewhere now\n}\n");
    const issues = checkAtlas(root, join(root, ".agents"));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain("excerpt");
  });

  it("warns without failing on an ambiguous anchor", () => {
    const root = project(atlas("| Gate | `src/gate.ts#runGate` | why | 2026-01-01 |"));
    put(root, "src/gate.ts", "export function runGate() {}\nexport function runGate() {}\n");
    const issues = checkAtlas(root, join(root, ".agents"));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message.startsWith("warning:")).toBe(true);
    expect(run("validate", root).code).toBe(0);
  });

  it("reports an excerpt that lives only in an unrelated function", () => {
    const root = project(atlas("| Gate | `src/gate.ts#runGate#writes to a temp file` | why | 2026-01-01 |"));
    put(root, "src/gate.ts", "export function runGate() {\n  // nothing here\n}\nexport function other() {\n  // writes to a temp file\n}\n");
    const issues = checkAtlas(root, join(root, ".agents"));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain("excerpt");
  });

  it("resolves silently when the excerpt identifies one of several symbol hits", () => {
    const root = project(atlas("| Gate | `src/gate.ts#runGate#writes to a temp file` | why | 2026-01-01 |"));
    put(root, "src/gate.ts", "export function runGate() {\n  // writes to a temp file\n}\nrunGate();\n");
    expect(checkAtlas(root, join(root, ".agents"))).toEqual([]);
  });

  it("resolves an excerpt in the leading comments above the symbol", () => {
    const root = project(atlas("| Gate | `src/gate.ts#runGate#does the thing` | why | 2026-01-01 |"));
    put(root, "src/gate.ts", "// does the thing\nexport function runGate() {}\n");
    expect(checkAtlas(root, join(root, ".agents"))).toEqual([]);
  });

  it("resolves an excerpt on a preceding line inside the same block", () => {
    const root = project(atlas("| Gate | `src/g.ts#helper#temp marker` | why | 2026-01-01 |"));
    put(root, "src/g.ts", 'export function runGate() {\n  const marker = "temp marker";\n  return helper();\n}\n');
    expect(checkAtlas(root, join(root, ".agents"))).toEqual([]);
  });

  it("ignores an excerpt in a code line above the symbol", () => {
    const root = project(atlas("| Gate | `src/gate.ts#runGate#unrelated marker` | why | 2026-01-01 |"));
    put(root, "src/gate.ts", 'const marker = "unrelated marker";\nexport function runGate() {}\n');
    const issues = checkAtlas(root, join(root, ".agents"));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain("excerpt");
  });

  it("ignores braces inside strings when finding the symbol block", () => {
    const root = project(atlas("| Gate | `src/gate.ts#runGate#writes to a temp file` | why | 2026-01-01 |"));
    put(root, "src/gate.ts", 'export function runGate() {\n  const close = "}";\n  const esc = "a\\"}b";\n  // writes to a temp file\n}\n');
    expect(checkAtlas(root, join(root, ".agents"))).toEqual([]);
  });

  it("reports an excerpt matching none of several symbol hits", () => {
    const root = project(atlas("| Gate | `src/gate.ts#runGate#nowhere text` | why | 2026-01-01 |"));
    put(root, "src/gate.ts", "export function runGate() {}\nrunGate();\n");
    const issues = checkAtlas(root, join(root, ".agents"));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain("excerpt");
  });

  it("reads an escaped pipe inside an excerpt instead of splitting the cell", () => {
    const root = project(atlas("| Gate | `src/gate.ts#runGate#a \\| b` | why | 2026-01-01 |"));
    put(root, "src/gate.ts", "export function runGate() {\n  // a | b\n}\n");
    expect(checkAtlas(root, join(root, ".agents"))).toEqual([]);
  });

  it("still reports a missing file when its excerpt contains an escaped pipe", () => {
    const root = project(atlas("| Gate | `gone#f#a \\| b` | why | 2026-01-01 |"));
    const issues = checkAtlas(root, join(root, ".agents"));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain("gone");
  });

  it("reports a malformed anchor instead of dropping it silently", () => {
    const root = project(atlas("| Gate | `#runGate` | why | 2026-01-01 |"));
    const issues = checkAtlas(root, join(root, ".agents"));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain("not a valid anchor");
  });

  it("reports an anchored reference to a directory instead of passing it", () => {
    const root = project(atlas("| Gate | `src/gate/#runGate` | why | 2026-01-01 |"));
    put(root, "src/gate/index.ts", "x");
    const issues = checkAtlas(root, join(root, ".agents"));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain("directory");
  });

  it("fails a :line past the end of the file", () => {
    const root = project(atlas("| Gate | `src/gate.ts:120` | why | 2026-01-01 |"));
    put(root, "src/gate.ts", "one\ntwo\nthree\n");
    const issues = checkAtlas(root, join(root, ".agents"));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain("120");
  });

  it("warns without failing on a :line pointing at a blank line", () => {
    const root = project(atlas("| Gate | `src/gate.ts:2` | why | 2026-01-01 |"));
    put(root, "src/gate.ts", "one\n\nthree\n");
    const issues = checkAtlas(root, join(root, ".agents"));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message.startsWith("warning:")).toBe(true);
  });

  it("names the row whose entry path is gone", () => {
    const root = project(atlas("| Auth | `src/auth/` | why | 2026-01-01 |"));
    const issues = checkAtlas(root, join(root, ".agents"));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain("src/auth/");
    expect(issues[0]?.message).toContain("Auth");
  });

  it("skips placeholders, globs, urls, packages and commands in the entry cell", () => {
    const root = project(atlas("| X | `<path>` `src/*.ts` `https://example.com/a` `@scope/pkg` `pnpm test` | why | 2026-01-01 |"));
    expect(checkAtlas(root, join(root, ".agents"))).toEqual([]);
  });

  it("only checks the Where table: other sections may name anything", () => {
    const root = project(`${atlas("| A | `a.md` | why | 2026-01-01 |")}\n## Why\n\n| Decision | Reason | Source |\n| --- | --- | --- |\n| d | r | \`gone/path.md\` |\n`);
    put(root, "a.md", "x");
    expect(checkAtlas(root, join(root, ".agents"))).toEqual([]);
  });

  it("fails an atlas past the line cap", () => {
    const rows = Array.from({ length: ATLAS_MAX_LINES }, (_, i) => `| T${i} | \`a.md\` | why | 2026-01-01 |`);
    const root = project(atlas(...rows));
    put(root, "a.md", "x");
    expect(checkAtlas(root, join(root, ".agents")).map((i) => i.message).join("\n")).toContain("lines");
  });

  it("when required: a missing atlas, or fewer than three Where rows, fails", () => {
    const empty = tempDir();
    expect(checkAtlas(empty, join(empty, ".agents"), { required: true })[0]?.message).toContain("no atlas");
    const thin = project(atlas("| A | `a.md` | why | 2026-01-01 |"));
    put(thin, "a.md", "x");
    expect(checkAtlas(thin, join(thin, ".agents"), { required: true })[0]?.message).toContain("fewer than 3");
  });

  it("when required: three real rows pass", () => {
    const root = project(atlas("| A | `a.md` | w | d |", "| B | `b.md` | w | d |", "| C | `c.md` | w | d |"));
    for (const f of ["a.md", "b.md", "c.md"]) put(root, f, "x");
    expect(checkAtlas(root, join(root, ".agents"), { required: true })).toEqual([]);
  });
});

describe("the kit stub and this repo's own atlas", () => {
  it("ships a stub that is empty but valid", () => {
    const stub = readFileSync(join(kitDir(), "atlas.template.md"), "utf8");
    const root = project(stub);
    expect(checkAtlas(root, join(root, ".agents"))).toEqual([]);
    expect(stub.split("\n").length).toBeLessThan(ATLAS_MAX_LINES);
  });

  it("keeps every entry path of this repo's atlas true", () => {
    expect(checkAtlas(repo, join(repo, ".agents"))).toEqual([]);
  });

  it("validate reports a stale row", () => {
    const root = project(atlas("| Auth | `src/auth/` | why | 2026-01-01 |"));
    const { code, text } = run("validate", root);
    expect(code).toBe(1);
    expect(text).toContain("src/auth/");
  });
});
