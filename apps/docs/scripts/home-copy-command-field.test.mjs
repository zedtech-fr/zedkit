import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const app = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(app, rel), "utf8");
}

test("hero and closing share one attached copy-command field (#246)", () => {
  const field = read("ui/home/home-copy-command-field.tsx");
  const copy = read("ui/home/i18n/home-copy-command-copy.ts");
  const tokens = read("app/docs-shell-tokens.css");

  assert.match(field, /"use client"/);
  assert.match(field, /\bInput\b/);
  assert.match(field, /\bButton\b/);
  assert.match(field, /useUiMessages/);
  assert.match(field, /data-home-copy-command/);
  assert.match(field, /data-site-action/);
  assert.match(field, /"aria-label": ariaLabel/);
  assert.match(field, /"aria-describedby": ariaDescribedBy/);
  assert.match(field, /aria-describedby=\{ariaDescribedBy\}/);
  assert.match(field, /aria-label=\{copied \? homeCopyCommandCopy\.copied : copyLabel\}/);
  assert.match(field, /role="status"/);
  assert.match(field, /aria-live="polite"/);
  assert.match(field, /messages\.copied/);
  assert.match(field, /messages\.copyFailed/);
  assert.match(field, /homeCopyCommandCopy\.copy/);
  assert.match(field, /homeCopyCommandCopy\.copied/);
  assert.match(field, /content-shrink/);
  assert.doesNotMatch(field, /import \{[^}]*\bSecretField\b|<\s*SecretField\b/);
  assert.doesNotMatch(field, /\bmultiline\b|Textarea|whitespace-pre-line|wrap-anywhere/);
  assert.match(copy, /copy: "Copy"/);
  assert.match(copy, /copied: "Copied"/);

  assert.match(tokens, /\[data-home-copy-command\]/);
  assert.match(tokens, /\[data-home-copy-command\] \{[^}]*overflow:\s*hidden/);
  assert.match(tokens, /\[data-home-copy-command\] \{[^}]*min-width:\s*0/);
  assert.match(
    tokens,
    /\[data-home-copy-command\] \[data-slot="button"\] \{[^}]*min-width:\s*88px/,
  );
  assert.doesNotMatch(tokens.match(/\[data-home-copy-command\][^{]*\{[^}]+\}/)?.[0] ?? "", /#[0-9A-Fa-f]{3,8}/);
});
