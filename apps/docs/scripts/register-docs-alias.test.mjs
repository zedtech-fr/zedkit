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
  "features/identity/ui/site-identity-storage.test.mjs",
];

test("registerDocsAlias resolves tsconfig @/ paths for node --test", () => {
  assert.equal(DEFAULT_IDENTITY, "glass");
});

test("identity node tests share registerDocsAlias instead of an inline @/ shim", () => {
  for (const rel of IDENTITY_ALIAS_TESTS) {
    const src = readFileSync(join(app, rel), "utf8");
    assert.match(src, /registerDocsAlias/, rel);
    assert.equal(src.includes("data:text/javascript"), false, `${rel} still inlines the @/ shim`);
  }
});
