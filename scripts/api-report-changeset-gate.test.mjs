import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  declarationsEquivalent,
  evaluateReportChange,
  parseReportDeclarations,
  remainderEqualsMain,
  resolvePublicDeclarations,
} from "./api-report-changeset-gate.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

const SEO_HEAD_ADDED_FN =
  "export function buildSoftwareSourceCodeJsonLd(options: SoftwareSourceCodeJsonLdOptions): WithContext<SoftwareSourceCode>;";
const SEO_HEAD_ADDED_IFACE = `export interface SoftwareSourceCodeJsonLdOptions {
    // (undocumented)
    codeRepository: string;
    // (undocumented)
    license?: string;
    // (undocumented)
    name: string;
    // (undocumented)
    programmingLanguage?: string;
    // (undocumented)
    url: string;
}`;
const SEO_SOURCE_IFACE = `export interface SoftwareSourceCodeJsonLdOptions {
  name: string;
  url: string;
  codeRepository: string;
  programmingLanguage?: string;
  license?: string;
}`;
const SEO_SOURCE_FN = `export function buildSoftwareSourceCodeJsonLd(
  options: SoftwareSourceCodeJsonLdOptions,
): WithContext<SoftwareSourceCode> {
  return { "@type": "SoftwareSourceCode" };
}`;
const SEO_PUBLISHED_DTS_IFACE = `export interface SoftwareSourceCodeJsonLdOptions {
    name: string;
    url: string;
    codeRepository: string;
    programmingLanguage?: string;
    license?: string;
}`;
const SEO_PUBLISHED_DTS_FN =
  "export declare function buildSoftwareSourceCodeJsonLd(options: SoftwareSourceCodeJsonLdOptions): WithContext<SoftwareSourceCode>;";

const MAIN_SEO_INDEX = `export {
  buildArticleJsonLd,
  buildSoftwareSourceCodeJsonLd,
  type SoftwareSourceCodeJsonLdOptions,
} from "./jsonld.js";
`;

const MAIN_SEO_JSONLD = `import type { SoftwareSourceCode, WithContext } from "schema-dts";

${SEO_SOURCE_IFACE}

${SEO_SOURCE_FN}
`;

const MAIN_SEO_SOURCES = {
  "src/index.ts": MAIN_SEO_INDEX,
  "src/jsonld.ts": MAIN_SEO_JSONLD,
};

const MAIN_REPORT = `## API Report File for "@zedtech/zedkit-seo"

\`\`\`ts
import type { Article } from 'schema-dts';
import type { WithContext } from 'schema-dts';

export function buildArticleJsonLd(options: ArticleJsonLdOptions): WithContext<Article>;

export interface ArticleJsonLdOptions {
    title: string;
}

export function otherFn(): void;
\`\`\`
`;

const HEAD_CATCHUP = `## API Report File for "@zedtech/zedkit-seo"

\`\`\`ts
import type { Article } from 'schema-dts';
import type { SoftwareSourceCode } from 'schema-dts';
import type { WithContext } from 'schema-dts';

export function buildArticleJsonLd(options: ArticleJsonLdOptions): WithContext<Article>;

export interface ArticleJsonLdOptions {
    title: string;
}

${SEO_HEAD_ADDED_FN}

export function otherFn(): void;

${SEO_HEAD_ADDED_IFACE}
\`\`\`
`;

describe("declarationsEquivalent", () => {
  it("matches the SEO report, origin/main source, and published 1.1.0 .d.ts", () => {
    assert.equal(declarationsEquivalent(SEO_HEAD_ADDED_FN, SEO_SOURCE_FN), true);
    assert.equal(declarationsEquivalent(SEO_HEAD_ADDED_FN, SEO_PUBLISHED_DTS_FN), true);
    assert.equal(declarationsEquivalent(SEO_HEAD_ADDED_IFACE, SEO_SOURCE_IFACE), true);
    assert.equal(declarationsEquivalent(SEO_HEAD_ADDED_IFACE, SEO_PUBLISHED_DTS_IFACE), true);
  });

  it("rejects a changed function return type", () => {
    assert.equal(
      declarationsEquivalent(SEO_HEAD_ADDED_FN, "export function buildSoftwareSourceCodeJsonLd(options: SoftwareSourceCodeJsonLdOptions): string {"),
      false,
    );
  });

  it("rejects a changed interface property type", () => {
    const changed = SEO_SOURCE_IFACE.replace("codeRepository: string", "codeRepository: number");
    assert.equal(declarationsEquivalent(SEO_HEAD_ADDED_IFACE, changed), false);
  });

  it("rejects generic constraint, default, and heritage mismatches", () => {
    const stringBound = "export interface Options<T extends string> { value: T }";
    const numberBound = "export interface Options<T extends number> { value: T }";
    const withDefault = 'export interface Options<T extends string = "x"> { value: T }';
    const extendsFoo = "export interface Options extends Foo { value: string }";
    const extendsBar = "export interface Options extends Bar { value: string }";
    assert.equal(declarationsEquivalent(stringBound, numberBound), false);
    assert.equal(declarationsEquivalent(stringBound, withDefault), false);
    assert.equal(declarationsEquivalent(extendsFoo, extendsBar), false);
    assert.equal(declarationsEquivalent(stringBound, stringBound), true);
    assert.equal(declarationsEquivalent(extendsFoo, extendsFoo), true);
  });
});

describe("resolvePublicDeclarations", () => {
  it("follows named re-exports to the source declaration", () => {
    const decls = resolvePublicDeclarations(MAIN_SEO_SOURCES, "src/index.ts");
    assert.equal(decls.has("buildSoftwareSourceCodeJsonLd"), true);
    assert.equal(decls.has("SoftwareSourceCodeJsonLdOptions"), true);
    assert.equal(declarationsEquivalent(SEO_HEAD_ADDED_FN, decls.get("buildSoftwareSourceCodeJsonLd")), true);
  });

  it("does not treat a comment or import of the name as a public export", () => {
    const commented = resolvePublicDeclarations(
      { "src/index.ts": "// planned: buildSoftwareSourceCodeJsonLd\nexport function otherFn(): void {}\n" },
      "src/index.ts",
    );
    const imported = resolvePublicDeclarations(
      {
        "src/index.ts": 'import { buildSoftwareSourceCodeJsonLd } from "./jsonld.js";\nexport function otherFn(): void {}\n',
        "src/jsonld.ts": SEO_SOURCE_FN,
      },
      "src/index.ts",
    );
    assert.equal(commented.has("buildSoftwareSourceCodeJsonLd"), false);
    assert.equal(imported.has("buildSoftwareSourceCodeJsonLd"), false);
  });

  it("does not treat a fake export in a block comment or template string as public", () => {
    const commented = resolvePublicDeclarations(
      {
        "src/index.ts":
          "/*\nexport interface Phantom {\n  x: string;\n}\n*/\nexport function otherFn(): void {}\n",
      },
      "src/index.ts",
    );
    const templated = resolvePublicDeclarations(
      {
        "src/index.ts":
          "const s = `\nexport interface Phantom { x: string }\n`;\nexport function otherFn(): void {}\n",
      },
      "src/index.ts",
    );
    assert.equal(commented.has("Phantom"), false);
    assert.equal(templated.has("Phantom"), false);
    assert.equal(commented.has("otherFn"), true);
    assert.equal(templated.has("otherFn"), true);
  });

  it("does not register the original name of an export { hidden as visible } re-export", () => {
    const decls = resolvePublicDeclarations(
      {
        "src/index.ts": 'export { hidden as visible } from "./impl.js";\n',
        "src/impl.ts": "export function hidden(): void {}\n",
      },
      "src/index.ts",
    );
    assert.equal(decls.has("hidden"), false);
    assert.equal(decls.has("visible"), false);
  });

  it("does not keep only the first overload as the public shape", () => {
    const decls = resolvePublicDeclarations(
      {
        "src/index.ts": `export function foo(x: string): void;
export function foo(x: number): void;
export function foo(x: string | number): void {}\n`,
      },
      "src/index.ts",
    );
    assert.equal(decls.has("foo"), false);
  });

  it("does not recover a local overload through export { f }", () => {
    const decls = resolvePublicDeclarations(
      {
        "src/index.ts": `function f(x: string): string;
function f(x: number): number;
function f(x: string | number): string | number { return x; }
export { f };
`,
      },
      "src/index.ts",
    );
    assert.equal(decls.has("f"), false);
  });

  it("still treats a single local function plus export { g } as public", () => {
    const decls = resolvePublicDeclarations(
      {
        "src/index.ts": `function g(x: string): string { return x; }
export { g };
`,
      },
      "src/index.ts",
    );
    assert.equal(decls.has("g"), true);
    assert.equal(
      declarationsEquivalent("export function g(x: string): string;", decls.get("g")),
      true,
    );
  });

  it("does not refeed a quarantined overload through a same-name re-export", () => {
    const fromOverloaded = resolvePublicDeclarations(
      {
        "src/index.ts": 'export { f } from "./impl.js";\n',
        "src/impl.ts": `function f(x: string): string;
function f(x: number): number;
function f(x: string | number): string | number { return x; }
export { f };
`,
      },
      "src/index.ts",
    );
    const localThenFrom = resolvePublicDeclarations(
      {
        "src/index.ts": `function f(x: string): string;
function f(x: number): number;
function f(x: string | number): string | number { return x; }
export { f } from "./simple.js";
`,
        "src/simple.ts": "export function f(x: string | number): string | number { return x; }\n",
      },
      "src/index.ts",
    );
    assert.equal(fromOverloaded.has("f"), false);
    assert.equal(localThenFrom.has("f"), false);
  });

  it("does not refeed a local overload through export * of the same name", () => {
    const decls = resolvePublicDeclarations(
      {
        "src/index.ts": `function f(x: string): string;
function f(x: number): number;
function f(x: string | number): string | number { return x; }
export * from "./simple.js";
`,
        "src/simple.ts": "export function f(x: string | number): string | number { return x; }\n",
      },
      "src/index.ts",
    );
    assert.equal(decls.has("f"), false);
  });

  it("still follows export * when the name is not quarantined", () => {
    const decls = resolvePublicDeclarations(
      {
        "src/index.ts": 'export * from "./simple.js";\n',
        "src/simple.ts": "export function g(x: string): string { return x; }\n",
      },
      "src/index.ts",
    );
    assert.equal(decls.has("g"), true);
    assert.equal(
      declarationsEquivalent("export function g(x: string): string;", decls.get("g")),
      true,
    );
  });
});

describe("evaluateReportChange", () => {
  it("skips a changeset for an exact equivalent SEO report catch-up", () => {
    const result = evaluateReportChange({
      mainReport: MAIN_REPORT,
      headReport: HEAD_CATCHUP,
      mainSources: MAIN_SEO_SOURCES,
      kinds: new Set(),
    });
    assert.deepEqual(result, { ok: true, skip: "already-on-main" });
    assert.equal(
      remainderEqualsMain(MAIN_REPORT, HEAD_CATCHUP, [
        "buildSoftwareSourceCodeJsonLd",
        "SoftwareSourceCodeJsonLdOptions",
      ]),
      true,
    );
  });

  it("still requires a changeset for a new export not on origin/main", () => {
    const result = evaluateReportChange({
      mainReport: MAIN_REPORT,
      headReport: MAIN_REPORT.replace(
        "export function otherFn(): void;",
        "export function buildNewThing(): void;\nexport function otherFn(): void;",
      ),
      mainSources: MAIN_SEO_SOURCES,
      kinds: new Set(),
    });
    assert.equal(result.ok, false);
    assert.equal(result.error, "add a changeset");
  });

  it("requires a changeset when the added catch-up signature does not match origin/main", () => {
    const head = HEAD_CATCHUP.replace(
      SEO_HEAD_ADDED_FN,
      "export function buildSoftwareSourceCodeJsonLd(options: SoftwareSourceCodeJsonLdOptions): string;",
    );
    const result = evaluateReportChange({
      mainReport: MAIN_REPORT,
      headReport: head,
      mainSources: MAIN_SEO_SOURCES,
      kinds: new Set(),
    });
    assert.equal(result.ok, false);
    assert.equal(result.error, "add a changeset");
  });

  it("requires a changeset when an existing interface property changes beside a catch-up export", () => {
    const head = HEAD_CATCHUP.replace("title: string;", "title?: string;");
    const result = evaluateReportChange({
      mainReport: MAIN_REPORT,
      headReport: head,
      mainSources: MAIN_SEO_SOURCES,
      kinds: new Set(),
    });
    assert.equal(result.ok, false);
    assert.equal(result.error, "add a changeset");
  });

  it("requires a changeset when the name only appears in a comment on origin/main", () => {
    const result = evaluateReportChange({
      mainReport: MAIN_REPORT,
      headReport: HEAD_CATCHUP,
      mainSources: {
        "src/index.ts": "// buildSoftwareSourceCodeJsonLd SoftwareSourceCodeJsonLdOptions\nexport function otherFn(): void {}\n",
      },
      kinds: new Set(),
    });
    assert.equal(result.ok, false);
    assert.equal(result.error, "add a changeset");
  });

  it("requires a changeset when generic constraints differ on a catch-up interface", () => {
    const result = evaluateReportChange({
      mainReport: MAIN_REPORT,
      headReport: MAIN_REPORT.replace(
        "export function otherFn(): void;",
        `export interface Options<T extends string> {
    value: T;
}

export function otherFn(): void;`,
      ),
      mainSources: {
        "src/index.ts": "export interface Options<T extends number> { value: T }\nexport function otherFn(): void {}\n",
      },
      kinds: new Set(),
    });
    assert.equal(result.ok, false);
    assert.equal(result.error, "add a changeset");
  });

  it("requires a changeset when heritage differs on a catch-up interface", () => {
    const result = evaluateReportChange({
      mainReport: MAIN_REPORT,
      headReport: MAIN_REPORT.replace(
        "export function otherFn(): void;",
        `export interface Options extends Foo {
    value: string;
}

export function otherFn(): void;`,
      ),
      mainSources: {
        "src/index.ts": "export interface Options extends Bar { value: string }\nexport function otherFn(): void {}\n",
      },
      kinds: new Set(),
    });
    assert.equal(result.ok, false);
    assert.equal(result.error, "add a changeset");
  });

  it("requires a changeset when the added export exists only inside a block comment", () => {
    const result = evaluateReportChange({
      mainReport: MAIN_REPORT,
      headReport: HEAD_CATCHUP,
      mainSources: {
        "src/index.ts": `/*
export function buildSoftwareSourceCodeJsonLd(options: SoftwareSourceCodeJsonLdOptions): WithContext<SoftwareSourceCode> {}
export interface SoftwareSourceCodeJsonLdOptions { name: string; url: string; codeRepository: string }
*/
export function otherFn(): void {}
`,
      },
      kinds: new Set(),
    });
    assert.equal(result.ok, false);
    assert.equal(result.error, "add a changeset");
  });

  it("requires a changeset when the added export exists only inside a template string", () => {
    const result = evaluateReportChange({
      mainReport: MAIN_REPORT,
      headReport: HEAD_CATCHUP,
      mainSources: {
        "src/index.ts":
          "const s = `\nexport function buildSoftwareSourceCodeJsonLd(options: SoftwareSourceCodeJsonLdOptions): WithContext<SoftwareSourceCode> {}\nexport interface SoftwareSourceCodeJsonLdOptions { name: string }\n`;\nexport function otherFn(): void {}\n",
      },
      kinds: new Set(),
    });
    assert.equal(result.ok, false);
    assert.equal(result.error, "add a changeset");
  });

  it("requires a changeset when HEAD adds the original name of an export { hidden as visible }", () => {
    const result = evaluateReportChange({
      mainReport: MAIN_REPORT,
      headReport: MAIN_REPORT.replace(
        "export function otherFn(): void;",
        "export function hidden(): void;\nexport function otherFn(): void;",
      ),
      mainSources: {
        "src/index.ts":
          'export { hidden as visible } from "./impl.js";\nexport function otherFn(): void {}\n',
        "src/impl.ts": "export function hidden(): void {}\n",
      },
      kinds: new Set(),
    });
    assert.equal(result.ok, false);
    assert.equal(result.error, "add a changeset");
  });

  it("requires a changeset when HEAD catch-up lists only the first overload", () => {
    const result = evaluateReportChange({
      mainReport: MAIN_REPORT,
      headReport: MAIN_REPORT.replace(
        "export function otherFn(): void;",
        "export function foo(x: string): void;\nexport function otherFn(): void;",
      ),
      mainSources: {
        "src/index.ts": `export function foo(x: string): void;
export function foo(x: number): void;
export function foo(x: string | number): void {}
export function otherFn(): void {}\n`,
      },
      kinds: new Set(),
    });
    assert.equal(result.ok, false);
    assert.equal(result.error, "add a changeset");
  });

  it("requires a changeset when local overloads are published only via export { f } as a union", () => {
    const result = evaluateReportChange({
      mainReport: MAIN_REPORT,
      headReport: MAIN_REPORT.replace(
        "export function otherFn(): void;",
        "export function f(x: string | number): string | number;\nexport function otherFn(): void;",
      ),
      mainSources: {
        "src/index.ts": `function f(x: string): string;
function f(x: number): number;
function f(x: string | number): string | number { return x; }
export { f };
export function otherFn(): void {}
`,
      },
      kinds: new Set(),
    });
    assert.equal(result.ok, false);
    assert.equal(result.error, "add a changeset");
  });

  it("requires a changeset when a local overload is refed through export * as a union", () => {
    const result = evaluateReportChange({
      mainReport: MAIN_REPORT,
      headReport: MAIN_REPORT.replace(
        "export function otherFn(): void;",
        "export function f(x: string | number): string | number;\nexport function otherFn(): void;",
      ),
      mainSources: {
        "src/index.ts": `function f(x: string): string;
function f(x: number): number;
function f(x: string | number): string | number { return x; }
export * from "./simple.js";
export function otherFn(): void {}
`,
        "src/simple.ts":
          "export function f(x: string | number): string | number { return x; }\n",
      },
      kinds: new Set(),
    });
    assert.equal(result.ok, false);
    assert.equal(result.error, "add a changeset");
  });

  it("requires a changeset when an identical signature imports Options from a different module", () => {
    const mainReport = `## API Report File

\`\`\`ts
export function otherFn(): void;
\`\`\`
`;
    const headReport = `## API Report File

\`\`\`ts
import { Options } from 'pkg-b';

export function f(x: Options): Options;

export function otherFn(): void;
\`\`\`
`;
    const result = evaluateReportChange({
      mainReport,
      headReport,
      mainSources: {
        "src/index.ts": `import { Options } from "pkg-a";
export function f(x: Options): Options { return x; }
export function otherFn(): void {}
`,
      },
      kinds: new Set(),
    });
    assert.equal(result.ok, false);
    assert.equal(result.error, "add a changeset");
  });

  it("requires a changeset when the imported name is an alias", () => {
    const mainReport = `## API Report File

\`\`\`ts
export function otherFn(): void;
\`\`\`
`;
    const headReport = `## API Report File

\`\`\`ts
import { Options } from 'pkg-a';

export function f(x: Options): Options;

export function otherFn(): void;
\`\`\`
`;
    const result = evaluateReportChange({
      mainReport,
      headReport,
      mainSources: {
        "src/index.ts": `import { Options as Opts } from "pkg-a";
export function f(x: Opts): Opts { return x; }
export function otherFn(): void {}
`,
      },
      kinds: new Set(),
    });
    assert.equal(result.ok, false);
    assert.equal(result.error, "add a changeset");
  });

  it("requires a changeset when the type is imported indirectly", () => {
    const mainReport = `## API Report File

\`\`\`ts
export function otherFn(): void;
\`\`\`
`;
    const headReport = `## API Report File

\`\`\`ts
import { Options } from 'pkg-a';

export function f(x: Options): Options;

export function otherFn(): void;
\`\`\`
`;
    const result = evaluateReportChange({
      mainReport,
      headReport,
      mainSources: {
        "src/index.ts": `import { Options } from "./proxy.js";
export function f(x: Options): Options { return x; }
export function otherFn(): void {}
`,
        "src/proxy.ts": 'export type { Options } from "pkg-a";\n',
      },
      kinds: new Set(),
    });
    assert.equal(result.ok, false);
    assert.equal(result.error, "add a changeset");
  });

  it("requires a changeset when a referenced type has no import or local binding", () => {
    const mainReport = `## API Report File

\`\`\`ts
export function otherFn(): void;
\`\`\`
`;
    const headReport = `## API Report File

\`\`\`ts
export function f(x: Options): Options;

export function otherFn(): void;
\`\`\`
`;
    const result = evaluateReportChange({
      mainReport,
      headReport,
      mainSources: {
        "src/index.ts": `export function f(x: Options): Options { return x; }
export function otherFn(): void {}
`,
      },
      kinds: new Set(),
    });
    assert.equal(result.ok, false);
    assert.equal(result.error, "add a changeset");
  });

  it("skips a changeset for a single local function published via export { g }", () => {
    const result = evaluateReportChange({
      mainReport: MAIN_REPORT,
      headReport: MAIN_REPORT.replace(
        "export function otherFn(): void;",
        "export function g(x: string): string;\nexport function otherFn(): void;",
      ),
      mainSources: {
        "src/index.ts": `function g(x: string): string { return x; }
export { g };
export function otherFn(): void {}
`,
      },
      kinds: new Set(),
    });
    assert.deepEqual(result, { ok: true, skip: "already-on-main" });
  });

  it("requires a changeset when the name only appears in an import on origin/main", () => {
    const result = evaluateReportChange({
      mainReport: MAIN_REPORT,
      headReport: HEAD_CATCHUP,
      mainSources: {
        "src/index.ts": 'import { buildSoftwareSourceCodeJsonLd, type SoftwareSourceCodeJsonLdOptions } from "./jsonld.js";\nexport function otherFn(): void {}\n',
        "src/jsonld.ts": MAIN_SEO_JSONLD,
      },
      kinds: new Set(),
    });
    assert.equal(result.ok, false);
    assert.equal(result.error, "add a changeset");
  });

  it("does not treat a removal as catch-up even if names exist on main", () => {
    const result = evaluateReportChange({
      mainReport: `${MAIN_REPORT.slice(0, MAIN_REPORT.indexOf("```\n"))}${SEO_HEAD_ADDED_FN}\n\`\`\`\n`,
      headReport: MAIN_REPORT,
      mainSources: MAIN_SEO_SOURCES,
      kinds: new Set(),
    });
    assert.equal(result.ok, false);
    assert.equal(result.error, "add a changeset");
  });

  it("still requires minor or major when an export is removed", () => {
    const result = evaluateReportChange({
      mainReport: 'export type CardProps = React_2.ComponentProps<"div">;\n',
      headReport: "",
      kinds: new Set(["patch"]),
    });
    assert.equal(result.ok, false);
    assert.equal(result.error, "removed needs minor/major");
  });

  it("accepts a minor changeset covering a removed export", () => {
    const result = evaluateReportChange({
      mainReport: 'export type CardProps = React_2.ComponentProps<"div">;\n',
      headReport: 'export type CardProps = React_2.ComponentProps<"div"> & {\n  extra: string;\n};\n',
      kinds: new Set(["minor"]),
    });
    assert.equal(result.ok, true);
  });
});

describe("live origin/main SEO report vs published 1.1.0", () => {
  it("HEAD catch-up declarations match origin/main source and the published .d.ts shape", () => {
    const mainReport = execSync("git show origin/main:packages/seo/etc/zedkit-seo.api.md", {
      cwd: ROOT,
      encoding: "utf8",
    });
    const headReport = readFileSync(join(ROOT, "packages/seo/etc/zedkit-seo.api.md"), "utf8");
    const index = execSync("git show origin/main:packages/seo/src/index.ts", { cwd: ROOT, encoding: "utf8" });
    const jsonld = execSync("git show origin/main:packages/seo/src/jsonld.ts", { cwd: ROOT, encoding: "utf8" });
    const result = evaluateReportChange({
      mainReport,
      headReport,
      mainSources: { "src/index.ts": index, "src/jsonld.ts": jsonld },
      kinds: new Set(),
    });
    const mainDecls = parseReportDeclarations(mainReport);
    const headDecls = parseReportDeclarations(headReport);
    const added = [...headDecls.keys()].filter((name) => !mainDecls.has(name));
    if (added.length === 0) {
      assert.equal(mainReport, headReport);
      assert.equal(result.ok, true);
      return;
    }
    assert.deepEqual(added.sort(), ["SoftwareSourceCodeJsonLdOptions", "buildSoftwareSourceCodeJsonLd"]);
    assert.equal(declarationsEquivalent(headDecls.get("buildSoftwareSourceCodeJsonLd"), SEO_PUBLISHED_DTS_FN), true);
    assert.equal(
      declarationsEquivalent(headDecls.get("SoftwareSourceCodeJsonLdOptions"), SEO_PUBLISHED_DTS_IFACE),
      true,
    );
    assert.deepEqual(result, { ok: true, skip: "already-on-main" });
  });
});

describe("wiring", () => {
  const sh = readFileSync(join(ROOT, "scripts/check-api-report.sh"), "utf8");

  it("check-api-report.sh runs the gate after the extractor", () => {
    assert.match(sh, /api-report-changeset-gate\.mjs/);
    const extractAt = sh.indexOf("extractor FAILED");
    const gateAt = sh.indexOf("api-report-changeset-gate.mjs");
    assert.ok(extractAt > 0 && gateAt > extractAt);
  });
});
