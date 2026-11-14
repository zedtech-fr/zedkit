import assert from "node:assert/strict";
import test from "node:test";

import { identityPresets, parseIdentityTokens } from "@zedtech/zedkit-ui";

import { registerDocsAlias } from "#scripts/register-docs-alias.mjs";

registerDocsAlias(import.meta.url);

const { acceptedIdentityTokens, patchTokens } = await import("./identity-editor-patch.ts");
const { isLightKey } = await import("@/features/identity/ui/identity-editor-search.ts");

const TOKENS = identityPresets.mist;

test("a valid spacing patch writes the same field Expert would write", () => {
  const next = patchTokens(TOKENS, "spacing", "0.4rem", "light", []);
  assert.equal(next.spacing, "0.4rem");
  assert.equal(parseIdentityTokens(next).success, true);
  assert.notEqual(next, TOKENS);
});

test("an illegal radius is refused and the previous tokens stay put", () => {
  const next = patchTokens(TOKENS, "radius", "}", "light", []);
  assert.equal(next, TOKENS);
});

test("a non-HSL background is refused and the previous tokens stay put", () => {
  const next = patchTokens(TOKENS, "background", "red", "light", []);
  assert.equal(next, TOKENS);
  assert.equal(next.light.background, TOKENS.light.background);
});

test("a url() colour is refused and the previous tokens stay put", () => {
  const next = patchTokens(TOKENS, "background", "url(https://example.test)", "light", []);
  assert.equal(next, TOKENS);
});

test("simple keys spacing, radius and background write the one schema", () => {
  const spacing = patchTokens(TOKENS, "spacing", "0.32rem", "light", []);
  const radius = patchTokens(TOKENS, "radius", "1rem", "light", []);
  const background = patchTokens(TOKENS, "background", "220 60% 97%", "light", []);
  assert.equal(spacing.spacing, "0.32rem");
  assert.equal(radius.radius, "1rem");
  assert.equal(background.light.background, "220 60% 97%");
  assert.equal(parseIdentityTokens(spacing).success, true);
  assert.equal(parseIdentityTokens(radius).success, true);
  assert.equal(parseIdentityTokens(background).success, true);
});

test("a light primary patch is still a full IdentityTokens the parser accepts", () => {
  const next = patchTokens(TOKENS, "primary", "10 60% 30%", "light", []);
  const parsed = parseIdentityTokens(next);
  assert.equal(parsed.success, true);
  assert.equal(next.light.primary, "10 60% 30%");
  assert.ok(next.dark);
  assert.ok(next.fontSans);
});

test("a dark background patch writes dark and leaves light unchanged", () => {
  const next = patchTokens(TOKENS, "background", "220 14% 10%", "dark", []);
  assert.equal(next.dark.background, "220 14% 10%");
  assert.equal(next.light.background, TOKENS.light.background);
});

test("a light patch of a kept-dark key leaves dark alone", () => {
  const darkened = patchTokens(TOKENS, "background", "10 20% 10%", "dark", []);
  const next = patchTokens(darkened, "background", "220 60% 97%", "light", ["background"]);
  assert.equal(next.light.background, "220 60% 97%");
  assert.equal(next.dark.background, darkened.dark.background);
});

test("isLightKey is the one palette-key check", () => {
  assert.equal(isLightKey("background"), true);
  assert.equal(isLightKey("spacing"), false);
  assert.equal(isLightKey(""), false);
});

test("acceptedIdentityTokens returns schema-clean tokens", () => {
  const accepted = acceptedIdentityTokens(TOKENS);
  assert.equal(parseIdentityTokens(accepted).success, true);
  assert.equal(accepted.spacing, TOKENS.spacing);
});

test("acceptedIdentityTokens refuses an illegal radius", () => {
  assert.equal(acceptedIdentityTokens({ ...TOKENS, radius: "}" }), undefined);
});

test("acceptedIdentityTokens refuses a non-HSL background", () => {
  assert.equal(
    acceptedIdentityTokens({
      ...TOKENS,
      light: { ...TOKENS.light, background: "red" },
    }),
    undefined,
  );
});
