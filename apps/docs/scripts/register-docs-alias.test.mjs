import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { registerDocsAlias } from "./register-docs-alias.mjs";

registerDocsAlias(import.meta.url);

const { DEFAULT_IDENTITY } = await import("@/lib/default-identity");

const app = join(dirname(fileURLToPath(import.meta.url)), "..");

const IDENTITY_ALIAS_TESTS = [
  "features/identity/ui/docs-site-default-tokens.test.mjs",
  "features/identity/ui/identity-editor-patch.test.mjs",
  "features/identity/ui/site-identity-storage.test.mjs",
];

test("registerDocsAlias resolves tsconfig @/ paths for node --test", () => {
  assert.equal(DEFAULT_IDENTITY, "glass");
});

test("identity node tests share registerDocsAlias instead of an inline @/ shim", () => {
  for (const rel of IDENTITY_ALIAS_TESTS) {
    const src = readFileSync(join(app, rel), "utf8");
    assert.match(src, /registerDocsAlias/, rel);
    assert.match(src, /from ["']#scripts\/register-docs-alias\.mjs["']/, rel);
    assert.equal(src.includes("data:text/javascript"), false, `${rel} still inlines the @/ shim`);
    assert.match(src, /await import\(["']@\//, `${rel} must await import() @/ after registerDocsAlias`);
    assert.equal(
      /(?:^|\n)import\s+[^;]*\sfrom\s+["']@\//.test(src),
      false,
      `${rel} static-imports @/ (hoisted before registerDocsAlias)`,
    );
  }
});

test("docs AGENTS.md requires await import() of @/ after registerDocsAlias", () => {
  const agents = readFileSync(join(app, "AGENTS.md"), "utf8");
  assert.match(agents, /await import\(\)/);
  assert.match(agents, /hoisted/);
});

test("docs package maps #scripts/* so colocated tests skip ../../../scripts", () => {
  const pkg = JSON.parse(readFileSync(join(app, "package.json"), "utf8"));
  assert.equal(pkg.imports["#scripts/*"], "./scripts/*");
});

test("eslint one-way hash ban shares one #scripts/ exemption regex", () => {
  const config = readFileSync(join(app, "../../eslint.config.mjs"), "utf8");
  const literals = config.match(/\^#\(\?!scripts\/\)/g) ?? [];
  assert.equal(literals.length, 1, "duplicate hash-import regex literals");
  assert.match(config, /docsHashAppImportRegex/);
});
