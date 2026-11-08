import assert from "node:assert/strict";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { generateThemePayload } from "./theme-payload.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

test("copy theme keeps later :root blocks and media, not only the first colour block", () => {
  const payload = generateThemePayload(root);
  assert.equal(payload.cssVars.light.primary, "hsl(240 5.9% 10%)");
  assert.equal(payload.cssVars.light["color-primary"], undefined);
  assert.equal(payload.cssVars.theme["color-primary"], "var(--primary)");
  assert.ok(payload.cssVars.theme["text-dense"]);
  assert.ok(payload.cssVars.theme["spacing-control-height"]);
  const tap = payload.css["@media (pointer: coarse), (max-width: 40rem)"];
  assert.ok(tap?.[":root"]?.["--zk-tap-min"] || tap?.[":root, [data-identity-scope]"]?.["--zk-tap-min"]);
  assert.equal(payload.css[":root"]?.["--motion-base"], "200ms");
  const identity = payload.css[":root[data-identity], [data-identity-scope][data-identity]"];
  assert.ok(identity);
  assert.equal(payload.cssVars.theme["text-heading"], "1.5rem");
});
