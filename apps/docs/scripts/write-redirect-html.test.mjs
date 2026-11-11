import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { redirectHtml, writeRedirectStub } from "./write-redirect-html.mjs";

test("redirect html escapes script breakouts in the target", () => {
  const html = redirectHtml("/x?</script><script>alert(1)</script>");
  assert.match(html, /\\u003c\/script\\u003e/);
  assert.doesNotMatch(html, /location\.replace\("[^"]*<script/);
  assert.match(html, /&lt;\/script&gt;/);
});

test("writeRedirectStub rejects traversal in the from path", () => {
  const dir = mkdtempSync(join(tmpdir(), "redir-html-"));
  assert.throws(() => writeRedirectStub(dir, "/reviews/pr/../etc", "/issues"));
  assert.throws(() => writeRedirectStub(dir, "/reviews/pr//64", "/issues"));
  writeRedirectStub(dir, "/reviews/pr/64", "/issues");
  const html = readFileSync(join(dir, "reviews/pr/64.html"), "utf8");
  assert.match(html, /location\.replace\("\/issues"\)/);
});
