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

test("rewriteUiImports maps nested relatives by basename", () => {
  const out = rewriteUiImports(`import { cn } from "../../utils.js";
import { Dialog } from "../dialog.js";
import { Button } from "./actions/button.js";`);
  assert.match(out, /from "@\/lib\/utils"/);
  assert.match(out, /from "@\/components\/ui\/dialog"/);
  assert.match(out, /from "@\/components\/ui\/button"/);
  assert.doesNotMatch(out, /\.\./);
});

test("rewriteUiImports throws on a missing mapping instead of inventing a path", () => {
  const known = new Set(["button"]);
  assert.throws(
    () => rewriteUiImports('import { Ghost } from "./ghost.js";', known),
    /missing mapping: ghost/,
  );
});
