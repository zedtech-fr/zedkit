import assert from "node:assert/strict";
import test from "node:test";

import { identityPresets, parseIdentityTokens } from "@zedtech/zedkit-ui";

import { patchTokens } from "../lib/identity-editor-patch.ts";

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
