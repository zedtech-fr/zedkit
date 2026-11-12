import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const app = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(app, rel), "utf8");
}

test("hero and closing share one wrapping copy-command field (#298)", () => {
  const field = read("ui/home/home-copy-command-field.tsx");
  const copy = read("ui/home/i18n/home-copy-command-copy.ts");
  const tokens = read("app/docs-shell-tokens.css");

  assert.match(field, /"use client"/);
  assert.match(field, /Text as="span"/);
  assert.match(field, /data-home-copy-command-value/);
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
  assert.match(field, /font-mono/);
  assert.match(field, /px-field-pad/);
  assert.match(field, /py-control-block/);
  assert.match(field, /writeText\(value\)/);
  assert.match(field, /if \(!clipboard\)/);
  assert.match(field, /setCopyFailed\(true\)/);
  assert.doesNotMatch(field, /import \{[^}]*\bInput\b|<\s*Input\b/);
  assert.doesNotMatch(field, /import \{[^}]*\bSecretField\b|<\s*SecretField\b/);
  assert.doesNotMatch(field, /\bmultiline\b|Textarea|whitespace-pre-line|wrap-anywhere/);
  assert.doesNotMatch(field, /role="textbox"/);
  assert.match(copy, /copy: "Copy"/);
  assert.match(copy, /copied: "Copied"/);

  const valueRule =
    tokens.match(/\[data-home-copy-command-value\][^{]*\{[^}]+\}/)?.[0] ?? "";
  assert.match(valueRule, /white-space:\s*pre-line/);
  assert.match(valueRule, /overflow-wrap:\s*anywhere/);
  assert.match(valueRule, /flex:\s*1 1 auto/);
  assert.match(valueRule, /min-width:\s*0/);
  assert.match(valueRule, /height:\s*auto/);
  assert.doesNotMatch(valueRule, /text-overflow:\s*ellipsis/);
  assert.doesNotMatch(valueRule, /#[0-9A-Fa-f]{3,8}/);

  const liveRule =
    tokens.match(/\[data-home-copy-command\] \[data-slot="text"\][^{]*\{[^}]+\}/)?.[0] ?? "";
  assert.equal(liveRule, "", "wrap CSS must not target the copy live region");

  assert.match(tokens, /\[data-home-copy-command\]/);
  assert.match(tokens, /\[data-home-copy-command\] \{[^}]*overflow:\s*hidden/);
  assert.match(tokens, /\[data-home-copy-command\] \{[^}]*min-width:\s*0/);
  assert.match(tokens, /\[data-home-copy-command\] \{[^}]*align-items:\s*stretch/);
  assert.match(
    tokens,
    /\[data-home-copy-command\] \[data-slot="button"\] \{[^}]*min-width:\s*88px/,
  );
  assert.match(
    tokens,
    /\[data-home-copy-command\] \[data-slot="button"\] \{[^}]*height:\s*auto/,
  );
  assert.doesNotMatch(tokens, /\[data-home-copy-command\][^\n]*\[data-slot="input"\]/);
  assert.doesNotMatch(tokens.match(/\[data-home-copy-command\][^{]*\{[^}]+\}/)?.[0] ?? "", /#[0-9A-Fa-f]{3,8}/);
});
