import assert from "node:assert/strict";
import test from "node:test";
import { rewriteUiImports } from "./rewrite-ui-imports.mjs";

test("rewriteUiImports maps utils and siblings to consumer aliases", () => {
  const input = `import { cn } from "./utils.js";
import { Button } from "./button.js";`;
  const out = rewriteUiImports(input);
  assert.match(out, /from "@\/lib\/utils"/);
  assert.match(out, /from "@\/components\/ui\/button"/);
  assert.doesNotMatch(out, /\.\/utils\.js/);
});
