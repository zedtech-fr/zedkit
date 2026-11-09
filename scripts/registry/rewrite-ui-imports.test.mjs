import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { consumerDestinations, rewriteUiImports } from "./rewrite-ui-imports.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

function fixture(files) {
  const dir = mkdtempSync(join(tmpdir(), "zk-ui-rw-"));
  for (const [rel, body] of Object.entries(files)) {
    const path = join(dir, rel);
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, body);
  }
  return dir;
}

function destinationsFor(dir, staged) {
  return consumerDestinations({
    canonicalUtils: join(dir, "utils.ts"),
    staged: staged.map(([rel, stem]) => [join(dir, rel), stem]),
  });
}

function rewrite(dir, importerRel, source, staged) {
  return rewriteUiImports(source, {
    importerPath: join(dir, importerRel),
    destinations: destinationsFor(dir, staged),
  });
}

test("rewriteUiImports maps utils and siblings to consumer aliases", () => {
  const dir = fixture({
    "utils.ts": "export function cn() {}\n",
    "button.tsx": "export const Button = 1;\n",
    "card.tsx": "export const Card = 1;\n",
  });
  const out = rewrite(
    dir,
    "card.tsx",
    `import { cn } from "./utils.js";
import { Button } from "./button.js";`,
    [["button.tsx", "button"]],
  );
  assert.match(out, /from "@\/lib\/utils"/);
  assert.match(out, /from "@\/components\/ui\/button"/);
  assert.doesNotMatch(out, /\.\/utils\.js/);
});

test("rewriteUiImports maps the messages provider to the consumer ui folder", () => {
  const dir = fixture({
    "utils.ts": "export function cn() {}\n",
    "ui-provider.tsx": "export function useUiMessages() {}\n",
  });
  const out = rewrite(
    dir,
    "button.tsx",
    'import { useUiMessages } from "./ui-provider.js";',
    [["ui-provider.tsx", "ui-provider"]],
  );
  assert.match(out, /from "@\/components\/ui\/ui-provider"/);
});

test("rewriteUiImports maps i18n package imports to vendored registry files", () => {
  const dir = fixture({ "utils.ts": "export function cn() {}\n" });
  const out = rewrite(
    dir,
    "button.tsx",
    'import { createMessagesContext } from "@zedtech/zedkit-i18n/react";',
    [],
  );
  assert.match(out, /from "@\/components\/ui\/create-messages-context"/);
});

test("rewriteUiImports maps nested relatives via the resolved target", () => {
  const dir = fixture({
    "utils.ts": "export function cn() {}\n",
    "dialog.tsx": "export const Dialog = 1;\n",
    "nested/card.tsx": "export const Card = 1;\n",
    "nested/actions/button.tsx": "export const Button = 1;\n",
  });
  const out = rewrite(
    dir,
    "nested/card.tsx",
    `import { cn } from "../utils.js";
import { Dialog } from "../dialog.js";
import { Button } from "./actions/button.js";`,
    [
      ["dialog.tsx", "dialog"],
      ["nested/actions/button.tsx", "button"],
    ],
  );
  assert.match(out, /from "@\/lib\/utils"/);
  assert.match(out, /from "@\/components\/ui\/dialog"/);
  assert.match(out, /from "@\/components\/ui\/button"/);
  assert.doesNotMatch(out, /\.\./);
});

test("rewriteUiImports keeps a local utils helper off the shadcn alias", () => {
  const dir = fixture({
    "utils.ts": "export function cn() {}\n",
    "button/utils.ts": "export function buttonClass() {}\n",
    "button/button.tsx": 'import { buttonClass } from "./utils.js";\n',
  });
  const source = 'import { buttonClass } from "./utils.js";\n';
  assert.throws(
    () => rewrite(dir, "button/button.tsx", source, [["button/button.tsx", "button"]]),
    /undeclared helper/,
  );
  const out = rewrite(dir, "button/button.tsx", source, [
    ["button/button.tsx", "button"],
    ["button/utils.ts", "button-utils"],
  ]);
  assert.match(out, /from "@\/components\/ui\/button-utils"/);
  assert.doesNotMatch(out, /from "@\/lib\/utils"/);
});

test("rewriteUiImports throws when a relative target is missing, even if the basename is staged", () => {
  const dir = fixture({
    "utils.ts": "export function cn() {}\n",
    "dialog.tsx": "export const Dialog = 1;\n",
    "button/button.tsx": "export const Button = 1;\n",
  });
  assert.throws(
    () =>
      rewrite(dir, "button/button.tsx", 'import { Dialog } from "./dialog.js";', [
        ["dialog.tsx", "dialog"],
        ["button/button.tsx", "button"],
      ]),
    /missing target/,
  );
});

test("consumerDestinations gives only the canonical utils file the shadcn alias", () => {
  const dir = fixture({
    "utils.ts": "export function cn() {}\n",
    "button.tsx": "export const Button = 1;\n",
  });
  const destinations = destinationsFor(dir, [
    ["utils.ts", "utils"],
    ["button.tsx", "button"],
  ]);
  assert.equal(destinations.get(join(dir, "utils.ts")), "@/lib/utils");
  assert.equal(destinations.get(join(dir, "button.tsx")), "@/components/ui/button");
  assert.equal([...destinations.values()].includes("@/components/ui/utils"), false);
});

test("consumerDestinations throws on two sources sharing one consumer path", () => {
  const dir = fixture({
    "utils.ts": "export function cn() {}\n",
    "a/button.tsx": "a",
    "b/button.ts": "b",
  });
  assert.throws(
    () =>
      destinationsFor(dir, [
        ["a/button.tsx", "button"],
        ["b/button.ts", "button"],
      ]),
    /ambiguous mapping/,
  );
});

test("nested Button source rewrites ../utils.js to the shadcn alias", () => {
  const src = join(repoRoot, "packages/ui/src");
  const importer = join(src, "button/button.tsx");
  const out = rewriteUiImports(readFileSync(importer, "utf8"), {
    importerPath: importer,
    destinations: consumerDestinations({
      canonicalUtils: join(src, "utils.ts"),
      staged: [[importer, "button"]],
    }),
  });
  assert.match(out, /from "@\/lib\/utils"/);
  assert.doesNotMatch(out, /from ["']\.\.?\//);
});
