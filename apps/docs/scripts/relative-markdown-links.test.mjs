import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { relativeMarkdownLinkErrors } from "./relative-markdown-links.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SIGNATURE = join(ROOT, "docs", "design", "signature.md");
const CONTRACT = join(ROOT, "apps", "docs", "VISUAL-CONTRACT.md");

test("flags ../apps/docs from docs/design (resolves under docs/apps/)", () => {
  const errors = relativeMarkdownLinkErrors(
    SIGNATURE,
    "[visual contract](../apps/docs/VISUAL-CONTRACT.md)",
  );
  assert.equal(errors.length, 1);
  assert.match(errors[0], /relative link \.\.\/apps\/docs\/VISUAL-CONTRACT\.md does not exist/);
});

test("accepts ../../apps/docs from docs/design", () => {
  const errors = relativeMarkdownLinkErrors(
    SIGNATURE,
    "[visual contract](../../apps/docs/VISUAL-CONTRACT.md#surfaces)",
  );
  assert.deepEqual(errors, []);
});

test("signature.md and VISUAL-CONTRACT.md relative links resolve on disk", () => {
  const files = [SIGNATURE, CONTRACT];
  const errors = files.flatMap((file) =>
    relativeMarkdownLinkErrors(file, readFileSync(file, "utf8")),
  );
  assert.deepEqual(errors, []);
});
