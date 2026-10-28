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

test("rewriteUiImports maps the messages provider to the consumer ui folder", () => {
  const out = rewriteUiImports('import { useUiMessages } from "./ui-provider.js";');
  assert.match(out, /from "@\/components\/ui\/ui-provider"/);
});

test("rewriteUiImports maps i18n package imports to vendored registry files", () => {
  const out = rewriteUiImports('import { createMessagesContext } from "@zedtech/zedkit-i18n/react";');
  assert.match(out, /from "@\/components\/ui\/create-messages-context"/);
});
